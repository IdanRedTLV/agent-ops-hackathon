import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

// Initialize Firebase Admin (only once)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

const TARGET_CHANNEL = 'C0A6QT8GYS2'; // The channel to import from

// One-time historical import endpoint
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST to trigger import.' });
  }

  const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

  if (!SLACK_BOT_TOKEN) {
    return res.status(500).json({ error: 'Slack bot token not configured' });
  }

  try {
    console.log('🚀 Starting historical message import...');

    // Fetch all messages from the channel
    const messages = await fetchAllChannelMessages(TARGET_CHANNEL, SLACK_BOT_TOKEN);
    console.log(`📨 Found ${messages.length} messages to process`);

    // Process each message
    const results = {
      total: messages.length,
      processed: 0,
      skipped: 0,
      errors: 0,
      workflows_created: 0,
      details: []
    };

    for (const message of messages) {
      try {
        // Skip bot messages and messages without a user
        if (message.subtype || message.bot_id || !message.user) {
          results.skipped++;
          continue;
        }

        const result = await processHistoricalMessage(message, SLACK_BOT_TOKEN);

        if (result.success) {
          results.workflows_created++;
          results.details.push({
            user: result.userName,
            workflow: result.workflowName,
            status: 'created'
          });
        } else {
          results.skipped++;
          results.details.push({
            user: result.userName || 'Unknown',
            reason: result.reason,
            status: 'skipped'
          });
        }

        results.processed++;
      } catch (error) {
        results.errors++;
        console.error('Error processing message:', error);
      }
    }

    console.log('✅ Import complete!', results);

    return res.status(200).json({
      success: true,
      message: 'Historical import completed',
      results
    });

  } catch (error) {
    console.error('❌ Import failed:', error);
    return res.status(500).json({
      error: 'Import failed',
      message: error.message
    });
  }
}

async function fetchAllChannelMessages(channelId, token) {
  const messages = [];
  let cursor = null;
  let hasMore = true;

  while (hasMore) {
    try {
      const url = cursor
        ? `https://slack.com/api/conversations.history?channel=${channelId}&limit=200&cursor=${cursor}`
        : `https://slack.com/api/conversations.history?channel=${channelId}&limit=200`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!data.ok) {
        console.error('Slack API error:', data.error);
        break;
      }

      messages.push(...(data.messages || []));

      cursor = data.response_metadata?.next_cursor;
      hasMore = !!cursor;

      // Small delay to avoid rate limits
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      break;
    }
  }

  return messages;
}

async function processHistoricalMessage(message, token) {
  const { user: slackUserId, text, ts, channel } = message;

  // Get user info from Slack
  const userInfo = await fetchSlackUser(slackUserId, token);
  if (!userInfo) {
    return { success: false, reason: 'Could not fetch user info' };
  }

  // Find matching team member in Firebase
  const teamMember = await findTeamMemberByEmail(userInfo.email);
  if (!teamMember) {
    return {
      success: false,
      reason: `No team member found for email: ${userInfo.email}`,
      userName: userInfo.name
    };
  }

  // Create workflow data
  const workflowName = extractWorkflowName(text);
  const slackThreadUrl = `https://tap-mobile.slack.com/archives/${TARGET_CHANNEL}/p${ts.replace('.', '')}`;

  const workflowData = {
    name: workflowName,
    mediaUrl: slackThreadUrl,
    mediaType: 'slack',
    createdAt: Date.now(),
  };

  // Check if workflow already exists
  const exists = await workflowExists(teamMember.id, slackThreadUrl);
  if (exists) {
    return {
      success: false,
      reason: 'Workflow already exists',
      userName: teamMember.name
    };
  }

  // Add workflow to team member's profile
  await addWorkflowToMember(teamMember.id, workflowData);

  return {
    success: true,
    userName: teamMember.name,
    workflowName
  };
}

async function fetchSlackUser(userId, token) {
  try {
    const response = await fetch(
      `https://slack.com/api/users.info?user=${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (data.ok && data.user) {
      return {
        email: data.user.profile.email,
        name: data.user.real_name || data.user.name,
        display_name: data.user.profile.display_name,
      };
    }
  } catch (error) {
    console.error('Error fetching Slack user:', error);
  }

  return null;
}

async function findTeamMemberByEmail(email) {
  if (!email) return null;

  const db = getDatabase();
  const teamRef = db.ref('hackathon/team');

  try {
    const snapshot = await teamRef.once('value');
    const teamData = snapshot.val();

    if (!teamData) return null;

    const membersArray = Array.isArray(teamData) ? teamData : Object.values(teamData);

    // Find member by email (case-insensitive)
    const member = membersArray.find(m =>
      m.email && m.email.toLowerCase() === email.toLowerCase()
    );

    return member || null;
  } catch (error) {
    console.error('Error finding team member:', error);
    return null;
  }
}

async function workflowExists(memberId, mediaUrl) {
  const db = getDatabase();
  const teamRef = db.ref('hackathon/team');

  try {
    const snapshot = await teamRef.once('value');
    const teamData = snapshot.val();

    if (!teamData) return false;

    const membersArray = Array.isArray(teamData) ? teamData : Object.values(teamData);
    const member = membersArray.find(m => m.id === memberId);

    if (!member) return false;

    const currentWorkflows = member.workflows || [];
    return currentWorkflows.some(w => w.mediaUrl === mediaUrl);
  } catch (error) {
    console.error('Error checking workflow existence:', error);
    return false;
  }
}

function extractWorkflowName(text) {
  // Remove URLs and clean up text
  let workflowName = text.replace(/<https?:\/\/[^\s]+>/g, '').trim();

  // Limit length
  if (workflowName.length > 100) {
    workflowName = workflowName.substring(0, 97) + '...';
  }

  return workflowName || 'Slack Workflow';
}

async function addWorkflowToMember(memberId, workflowData) {
  const db = getDatabase();
  const teamRef = db.ref('hackathon/team');

  try {
    const snapshot = await teamRef.once('value');
    const teamData = snapshot.val();

    if (!teamData) return;

    const membersArray = Array.isArray(teamData) ? teamData : Object.values(teamData);
    const memberIndex = membersArray.findIndex(m => m.id === memberId);

    if (memberIndex === -1) return;

    const member = membersArray[memberIndex];
    const currentWorkflows = member.workflows || [];

    // Add new workflow
    member.workflows = [...currentWorkflows, workflowData];
    membersArray[memberIndex] = member;

    // Save back to Firebase
    await teamRef.set(membersArray);

    console.log(`✅ Workflow added to ${member.name}`);
  } catch (error) {
    console.error('Error adding workflow:', error);
    throw error;
  }
}
