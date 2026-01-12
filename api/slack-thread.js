// Vercel Serverless Function to fetch Slack thread messages
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { channel, ts } = req.query;

  if (!channel || !ts) {
    return res.status(400).json({
      error: 'Missing required parameters: channel and ts'
    });
  }

  const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

  if (!SLACK_BOT_TOKEN) {
    return res.status(500).json({
      error: 'Slack bot token not configured'
    });
  }

  try {
    // Fetch thread messages from Slack API
    const response = await fetch(
      `https://slack.com/api/conversations.replies?channel=${channel}&ts=${ts}`,
      {
        headers: {
          'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!data.ok) {
      console.error('Slack API error:', data.error);
      return res.status(400).json({
        error: data.error || 'Failed to fetch thread from Slack',
        details: data
      });
    }

    // Fetch user information for all unique users in the thread
    const userIds = [...new Set(data.messages.map(msg => msg.user))];
    const users = {};

    // Fetch user details in parallel
    await Promise.all(
      userIds.map(async (userId) => {
        if (!userId) return;
        try {
          const userResponse = await fetch(
            `https://slack.com/api/users.info?user=${userId}`,
            {
              headers: {
                'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
                'Content-Type': 'application/json',
              },
            }
          );
          const userData = await userResponse.json();
          if (userData.ok && userData.user) {
            users[userId] = {
              name: userData.user.real_name || userData.user.name,
              avatar: userData.user.profile.image_72 || userData.user.profile.image_48,
              display_name: userData.user.profile.display_name || userData.user.name,
            };
          }
        } catch (err) {
          console.error(`Failed to fetch user ${userId}:`, err);
        }
      })
    );

    // Format messages with user data
    const formattedMessages = data.messages.map(msg => ({
      text: msg.text,
      user: users[msg.user] || { name: 'Unknown User', avatar: null, display_name: 'Unknown' },
      timestamp: msg.ts,
      thread_ts: msg.thread_ts,
      replies: msg.reply_count || 0,
    }));

    return res.status(200).json({
      success: true,
      messages: formattedMessages,
      channel,
    });

  } catch (error) {
    console.error('Error fetching Slack thread:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
