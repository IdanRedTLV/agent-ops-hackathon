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

const TARGET_CHANNEL = 'C0A6QT8GYS2'; // The channel to listen to

// Vercel Serverless Function to handle Slack Events
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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body;

  // Handle Slack URL verification challenge
  if (body.type === 'url_verification') {
    return res.status(200).json({ challenge: body.challenge });
  }

  // Handle actual events
  if (body.type === 'event_callback') {
    const event = body.event;

    // Only process messages in the target channel
    if (event.type === 'message' && event.channel === TARGET_CHANNEL) {
      // Ignore bot messages and message edits/deletes
      if (event.subtype || event.bot_id) {
        return res.status(200).json({ ok: true });
      }

      try {
        await processWorkflowMessage(event);
        return res.status(200).json({ ok: true });
      } catch (error) {
        console.error('Error processing workflow message:', error);
        return res.status(200).json({ ok: true }); // Always return 200 to Slack
      }
    }
  }

  return res.status(200).json({ ok: true });
}

async function processWorkflowMessage(event) {
  const { user: slackUserId, text, ts, channel, files } = event;

  // Get user info from Slack
  const userInfo = await fetchSlackUser(slackUserId);
  if (!userInfo) {
    console.error('Could not fetch Slack user info');
    return;
  }

  // Find matching team member in Firebase
  const teamMember = await findTeamMemberByEmail(userInfo.email);
  if (!teamMember) {
    console.log(`No team member found for email: ${userInfo.email}`);
    return;
  }

  // Create workflow data
  const workflowName = extractWorkflowName(text);
  const slackThreadUrl = `https://tap-mobile.slack.com/archives/${channel}/p${ts.replace('.', '')}`;

  // Extract attachments from message
  const attachments = extractAttachments(files);

  const workflowData = {
    name: workflowName,
    mediaUrl: slackThreadUrl,
    mediaType: 'slack',
    createdAt: Date.now(),
    attachments: attachments.length > 0 ? attachments : undefined,
  };

  // Add workflow to team member's profile
  await addWorkflowToMember(teamMember.id, workflowData);

  console.log(`✅ Auto-added workflow for ${teamMember.name}: ${workflowName} (${attachments.length} attachments)`);
}

async function fetchSlackUser(userId) {
  const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

  try {
    const response = await fetch(
      `https://slack.com/api/users.info?user=${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
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

function extractWorkflowName(text) {
  // Remove URLs and clean up text
  let workflowName = text.replace(/<https?:\/\/[^\s]+>/g, '').trim();

  // Limit length
  if (workflowName.length > 100) {
    workflowName = workflowName.substring(0, 97) + '...';
  }

  return workflowName || 'Slack Workflow';
}

function extractAttachments(files) {
  if (!files || !Array.isArray(files)) {
    return [];
  }

  return files.map(file => ({
    id: file.id,
    name: file.name,
    title: file.title,
    mimetype: file.mimetype,
    filetype: file.filetype,
    url: file.url_private || file.permalink,
    thumbnail: file.thumb_360 || file.thumb_160 || file.thumb_80,
    size: file.size,
  }));
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

    // Check if workflow with same URL already exists
    const exists = currentWorkflows.some(w =>
      w.mediaUrl === workflowData.mediaUrl
    );

    if (exists) {
      console.log('Workflow already exists, skipping');
      return;
    }

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
