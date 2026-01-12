import React, { useState, useEffect } from 'react';
import { database, auth } from './firebase';
import { ref, onValue, set } from 'firebase/database';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';

const AgentOpsHackathon = () => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', 'reset'
  const [authSuccess, setAuthSuccess] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const [selectedMember, setSelectedMember] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [newWorkflow, setNewWorkflow] = useState('');
  const [workflowMediaUrl, setWorkflowMediaUrl] = useState('');
  const [viewingWorkflow, setViewingWorkflow] = useState(null);
  const [slackThread, setSlackThread] = useState(null);
  const [loadingSlackThread, setLoadingSlackThread] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [lastSync, setLastSync] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [activeMilestoneId, setActiveMilestoneId] = useState(3); // Default to milestone 3

  // Admin emails - these users can edit anyone's profile
  const adminEmails = [
    'idan@redtlv.com',
    'maria@tap.pm'
  ];

  const isAdmin = user && adminEmails.includes(user.email?.toLowerCase());

  const defaultMilestones = [
    { id: 1, date: 'JAN 7', title: 'PREPARATION', desc: 'Course + Reading', xp: 100, icon: '📚' },
    { id: 2, date: 'JAN 8', title: 'WORKSHOP', desc: 'Live Workflow Demo', xp: 150, icon: '🎮' },
    { id: 3, date: 'JAN 12', title: 'DEMO PACK', desc: '3 Workflows Submitted', xp: 300, icon: '📦' },
    { id: 4, date: 'JAN 22', title: 'CHECKPOINT', desc: 'Mid-Period Review', xp: 200, icon: '🎯' },
    { id: 5, date: 'FEB 1', title: 'FINAL EVAL', desc: 'Full Submission', xp: 500, icon: '🏆' },
  ];

  const milestoneIcons = ['📚', '🎮', '📦', '🎯', '🏆', '🚀', '⭐', '💎', '🔥', '⚡', '🎨', '💻', '📊', '🧠', '🎪'];

  const defaultTeamMembers = [
    { id: 1, name: 'Alex Artemov', role: 'Android Lead', avatar: '🤖', completedMilestones: [], workflows: [], streak: 0, email: '' },
    { id: 2, name: 'Alex Uchitlev', role: 'Android Developer', avatar: '📱', completedMilestones: [], workflows: [], streak: 0, email: '' },
    { id: 3, name: 'Mikhail Listratsenka', role: 'Android Developer', avatar: '🔧', completedMilestones: [], workflows: [], streak: 0, email: '' },
    { id: 4, name: 'Vladislav Karpman', role: 'Android Developer', avatar: '⚙️', completedMilestones: [], workflows: [], streak: 0, email: '' },
    { id: 5, name: 'Quan Nguen', role: 'iOS Lead', avatar: '🍎', completedMilestones: [], workflows: [], streak: 0, email: '' },
    { id: 6, name: 'Kiet Nguen', role: 'iOS Developer', avatar: '📲', completedMilestones: [], workflows: [], streak: 0, email: '' },
    { id: 7, name: 'Guan Jhen Chen', role: 'iOS Developer', avatar: '🎯', completedMilestones: [], workflows: [], streak: 0, email: '' },
    { id: 8, name: 'Alper Kilislioglu', role: 'Motion Designer', avatar: '🎬', completedMilestones: [], workflows: [], streak: 0, email: '' },
    { id: 9, name: 'Liang Wu', role: 'AI Developer', avatar: '🧠', completedMilestones: [], workflows: [], streak: 0, email: '' },
    { id: 10, name: 'Yuri Osadchy', role: 'Designer', avatar: '🎨', completedMilestones: [], workflows: [], streak: 0, email: '' },
    { id: 11, name: 'Harel Levin', role: 'Analyst Lead', avatar: '📊', completedMilestones: [], workflows: [], streak: 0, email: '' },
    { id: 12, name: 'Nati Levi', role: 'Backend Developer', avatar: '🖥️', completedMilestones: [], workflows: [], streak: 0, email: '' },
    { id: 13, name: 'Stas Frid', role: 'Backend Developer', avatar: '💻', completedMilestones: [], workflows: [], streak: 0, email: '' },
    { id: 14, name: 'Tal Riftin', role: 'Designer', avatar: '✨', completedMilestones: [], workflows: [], streak: 0, email: '' },
    { id: 15, name: 'Gal Barlas', role: 'Marketing Manager', avatar: '📈', completedMilestones: [], workflows: [], streak: 0, email: '' },
    { id: 16, name: 'Line Sebban', role: 'Product Manager', avatar: '🚀', completedMilestones: [], workflows: [], streak: 0, email: '' },
    { id: 17, name: 'Yoav Tzori', role: 'Analyst', avatar: '📉', completedMilestones: [], workflows: [], streak: 0, email: '' },
    { id: 18, name: 'Avigail Kriginchev', role: 'QA', avatar: '🔍', completedMilestones: [], workflows: [], streak: 0, email: '' },
    { id: 19, name: 'Maria Lubarsky', role: 'HR', avatar: '💜', completedMilestones: [], workflows: [], streak: 0, email: '' },
  ];

  const badges = {
    early_bird: { name: 'Early Bird', icon: '🌅', desc: 'Completed prep before deadline' },
    workflow_wizard: { name: 'Workflow Wizard', icon: '🧙', desc: '3+ workflows submitted' },
    bug_hunter: { name: 'Bug Hunter', icon: '🐛', desc: 'QA excellence' },
    creative_genius: { name: 'Creative Genius', icon: '💡', desc: 'Innovative workflow design' },
    streak_master: { name: 'Streak Master', icon: '🔥', desc: '5+ day streak' },
    team_player: { name: 'Team Player', icon: '🤝', desc: 'Leadership role' },
    code_ninja: { name: 'Code Ninja', icon: '⚡', desc: 'Developer excellence' },
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to Firebase real-time updates
  useEffect(() => {
    const teamRef = ref(database, 'hackathon/team');
    const unsubscribe = onValue(teamRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const membersArray = Array.isArray(data) ? data : Object.values(data);
        setTeamMembers(membersArray);
        setLastSync(new Date());
      } else {
        initializeDatabase();
      }
      setIsLoading(false);
      setIsConnected(true);
    }, (error) => {
      console.error('Firebase error:', error);
      setIsConnected(false);
      const saved = localStorage.getItem('hackathon-team-data');
      if (saved) setTeamMembers(JSON.parse(saved));
      else setTeamMembers(defaultTeamMembers);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to milestones updates
  useEffect(() => {
    const milestonesRef = ref(database, 'hackathon/milestones');
    const unsubscribe = onValue(milestonesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const milestonesArray = Array.isArray(data) ? data : Object.values(data);
        setMilestones(milestonesArray);
      } else {
        // Initialize milestones in Firebase
        set(milestonesRef, defaultMilestones);
        setMilestones(defaultMilestones);
      }
    }, (error) => {
      console.error('Milestones Firebase error:', error);
      setMilestones(defaultMilestones);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to active milestone
  useEffect(() => {
    const activeRef = ref(database, 'hackathon/activeMilestoneId');
    const unsubscribe = onValue(activeRef, (snapshot) => {
      if (snapshot.exists()) {
        setActiveMilestoneId(snapshot.val());
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch Slack thread when viewing a Slack workflow
  useEffect(() => {
    if (viewingWorkflow) {
      const media = getWorkflowMedia(viewingWorkflow);
      if (media && media.type === 'slack') {
        fetchSlackThread(media.url);
      } else {
        setSlackThread(null);
      }
    } else {
      setSlackThread(null);
    }
  }, [viewingWorkflow]);

  const initializeDatabase = async () => {
    try {
      const teamRef = ref(database, 'hackathon/team');
      await set(teamRef, defaultTeamMembers);
      setTeamMembers(defaultTeamMembers);
    } catch (error) {
      console.error('Error initializing database:', error);
      setTeamMembers(defaultTeamMembers);
    }
  };

  const saveData = async (data) => {
    try {
      const teamRef = ref(database, 'hackathon/team');
      await set(teamRef, data);
      localStorage.setItem('hackathon-team-data', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to Firebase:', error);
      localStorage.setItem('hackathon-team-data', JSON.stringify(data));
    }
  };

  const saveMilestones = async (data) => {
    try {
      const milestonesRef = ref(database, 'hackathon/milestones');
      await set(milestonesRef, data);
    } catch (error) {
      console.error('Error saving milestones:', error);
    }
  };

  const updateMilestone = async (updatedMilestone) => {
    const newMilestones = milestones.map(m => 
      m.id === updatedMilestone.id ? updatedMilestone : m
    );
    setMilestones(newMilestones);
    await saveMilestones(newMilestones);
    setEditingMilestone(null);
  };

  const setFeaturedMilestone = async (milestoneId) => {
    try {
      const activeRef = ref(database, 'hackathon/activeMilestoneId');
      await set(activeRef, milestoneId);
      setActiveMilestoneId(milestoneId);
    } catch (error) {
      console.error('Error setting active milestone:', error);
    }
  };

  // Get the currently featured milestone
  const currentMilestones = milestones.length > 0 ? milestones : defaultMilestones;
  const featuredMilestone = currentMilestones.find(m => m.id === activeMilestoneId) || currentMilestones[2];

  // Auth handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      setShowLoginModal(false);
      setLoginEmail('');
      setLoginPassword('');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        setAuthError('No account found. Please sign up first.');
      } else if (error.code === 'auth/wrong-password') {
        setAuthError('Incorrect password.');
      } else {
        setAuthError(error.message);
      }
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await createUserWithEmailAndPassword(auth, loginEmail, loginPassword);
      setAuthSuccess('Account created! You are now logged in.');
      setShowLoginModal(false);
      setLoginEmail('');
      setLoginPassword('');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setAuthError('Email already in use. Try logging in.');
      } else if (error.code === 'auth/weak-password') {
        setAuthError('Password should be at least 6 characters.');
      } else {
        setAuthError(error.message);
      }
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await sendPasswordResetEmail(auth, loginEmail);
      setAuthSuccess('Password reset email sent! Check your inbox.');
      setAuthMode('login');
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Helper to require login before an action
  const requireLogin = (action) => {
    if (!user) {
      setShowLoginModal(true);
      return false;
    }
    return true;
  };

  // Find the current user's team member profile
  const currentUserMember = user ? teamMembers.find(m => 
    m.email?.toLowerCase() === user.email?.toLowerCase()
  ) : null;

  // Check if user can edit a member (their own profile OR admin)
  const canEdit = (member) => {
    if (!user) return false;
    if (isAdmin) return true;
    return member.email?.toLowerCase() === user.email?.toLowerCase();
  };

  // Check if user owns this specific profile
  const isOwner = (member) => {
    if (!user) return false;
    return member.email?.toLowerCase() === user.email?.toLowerCase();
  };

  const calculateXP = (completedMilestones) => {
    if (!completedMilestones) return 0;
    const currentMilestones = milestones.length > 0 ? milestones : defaultMilestones;
    return completedMilestones.reduce((total, mId) => {
      const milestone = currentMilestones.find(m => m.id === mId);
      return total + (milestone ? milestone.xp : 0);
    }, 0);
  };

  const getLevel = (xp) => Math.floor(xp / 200) + 1;
  const getXPForNextLevel = (xp) => getLevel(xp) * 200;
  const getXPProgress = (xp) => {
    const currentLevelXP = (getLevel(xp) - 1) * 200;
    const nextLevelXP = getLevel(xp) * 200;
    return ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  };

  const calculateBadges = (member) => {
    const newBadges = [];
    if (member.completedMilestones?.includes(1)) newBadges.push('early_bird');
    if (member.workflows?.length >= 3) newBadges.push('workflow_wizard');
    if (member.streak >= 5) newBadges.push('streak_master');
    const role = member.role?.toLowerCase() || '';
    if (role.includes('qa')) newBadges.push('bug_hunter');
    if (role.includes('design') || role.includes('marketing')) newBadges.push('creative_genius');
    if (role.includes('developer') || role.includes('backend') || role.includes('android') || role.includes('ios') || role.includes('ai')) newBadges.push('code_ninja');
    if (role.includes('lead') || role.includes('manager')) newBadges.push('team_player');
    return [...new Set(newBadges)];
  };

  const getMemberWithStats = (member) => {
    const xp = calculateXP(member.completedMilestones);
    return { ...member, xp, level: getLevel(xp), badges: calculateBadges(member) };
  };

  const membersWithStats = teamMembers.map(getMemberWithStats);
  const sortedMembers = [...membersWithStats].sort((a, b) => b.xp - a.xp);

  const updateMember = async (updatedMember) => {
    const newTeamMembers = teamMembers.map(m => m.id === updatedMember.id ? updatedMember : m);
    setTeamMembers(newTeamMembers);
    await saveData(newTeamMembers);
  };

  const claimProfile = async (member) => {
    if (!user) return;
    const updatedMember = { ...member, email: user.email };
    await updateMember(updatedMember);
  };

  const toggleMilestone = (milestoneId) => {
    if (!editingMember) return;
    const currentMilestones = editingMember.completedMilestones || [];
    const newCompleted = currentMilestones.includes(milestoneId)
      ? currentMilestones.filter(id => id !== milestoneId)
      : [...currentMilestones, milestoneId].sort((a, b) => a - b);
    setEditingMember({ ...editingMember, completedMilestones: newCompleted });
  };

  const addWorkflow = async () => {
    if (!newWorkflow.trim() || !editingMember) return;
    
    let workflowData = {
      name: newWorkflow.trim(),
      mediaUrl: workflowMediaUrl.trim() || null,
      mediaType: workflowMediaUrl.trim() ? detectMediaType(workflowMediaUrl.trim()) : null,
      createdAt: Date.now()
    };
    
    const currentWorkflows = editingMember.workflows || [];
    setEditingMember({ 
      ...editingMember, 
      workflows: [...currentWorkflows, workflowData] 
    });
    
    setNewWorkflow('');
    setWorkflowMediaUrl('');
  };

  // Detect media type from URL
  const detectMediaType = (url) => {
    const lowerUrl = url.toLowerCase();

    // Slack
    if (lowerUrl.includes('slack.com') || lowerUrl.includes('slack-files.com')) {
      return 'slack';
    }
    // YouTube
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
      return 'youtube';
    }
    // Loom
    if (lowerUrl.includes('loom.com')) {
      return 'loom';
    }
    // Vimeo
    if (lowerUrl.includes('vimeo.com')) {
      return 'vimeo';
    }
    // Google Drive
    if (lowerUrl.includes('drive.google.com')) {
      return 'gdrive';
    }
    // Direct video files
    if (lowerUrl.match(/\.(mp4|webm|mov|avi)(\?|$)/)) {
      return 'video';
    }
    // Images
    if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/)) {
      return 'image';
    }
    // Default to link
    return 'link';
  };

  // Get embed URL for videos
  const getEmbedUrl = (url, type) => {
    if (type === 'youtube') {
      const videoId = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : url;
    }
    if (type === 'loom') {
      const loomId = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
      return loomId ? `https://www.loom.com/embed/${loomId[1]}` : url;
    }
    if (type === 'vimeo') {
      const vimeoId = url.match(/vimeo\.com\/(\d+)/);
      return vimeoId ? `https://player.vimeo.com/video/${vimeoId[1]}` : url;
    }
    return url;
  };

  // Get thumbnail URL for video previews
  const getVideoThumbnail = (url, type) => {
    if (type === 'youtube') {
      const videoId = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      return videoId ? `https://img.youtube.com/vi/${videoId[1]}/mqdefault.jpg` : null;
    }
    if (type === 'loom') {
      const loomId = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
      return loomId ? `https://cdn.loom.com/sessions/thumbnails/${loomId[1]}-00001.jpg` : null;
    }
    // Vimeo thumbnails require API call, so we'll just show a placeholder
    return null;
  };

  // Parse Slack URL to extract channel and timestamp
  const parseSlackUrl = (url) => {
    // Format: https://[workspace].slack.com/archives/[CHANNEL_ID]/p[TIMESTAMP]
    const match = url.match(/slack\.com\/archives\/([A-Z0-9]+)\/p(\d+)/);
    if (match) {
      return {
        channel: match[1],
        ts: match[2].slice(0, 10) + '.' + match[2].slice(10), // Convert p1234567890123456 to 1234567890.123456
      };
    }
    return null;
  };

  // Fetch Slack thread from our API
  const fetchSlackThread = async (url) => {
    const parsed = parseSlackUrl(url);
    if (!parsed) {
      console.error('Invalid Slack URL');
      return null;
    }

    setLoadingSlackThread(true);
    try {
      const response = await fetch(
        `/api/slack-thread?channel=${parsed.channel}&ts=${parsed.ts}`
      );
      const data = await response.json();

      if (data.success) {
        setSlackThread(data);
        return data;
      } else {
        console.error('Failed to fetch Slack thread:', data.error);
        setSlackThread({ error: data.error });
        return null;
      }
    } catch (error) {
      console.error('Error fetching Slack thread:', error);
      setSlackThread({ error: 'Failed to load thread' });
      return null;
    } finally {
      setLoadingSlackThread(false);
    }
  };

  const removeWorkflow = (index) => {
    if (!editingMember) return;
    setEditingMember({ ...editingMember, workflows: editingMember.workflows.filter((_, i) => i !== index) });
  };

  // Helper to get workflow name (handles both old string format and new object format)
  const getWorkflowName = (workflow) => {
    if (typeof workflow === 'string') return workflow;
    return workflow?.name || 'Unnamed Workflow';
  };

  const getWorkflowMedia = (workflow) => {
    if (typeof workflow === 'string') return null;
    return workflow?.mediaUrl ? { url: workflow.mediaUrl, type: workflow.mediaType } : null;
  };

  const updateStreak = (delta) => {
    if (!editingMember) return;
    const newStreak = Math.max(0, (editingMember.streak || 0) + delta);
    setEditingMember({ ...editingMember, streak: newStreak });
  };

  const saveEdits = async () => {
    if (!editingMember) return;
    await updateMember(editingMember);
    setEditingMember(null);
  };

  const resetData = async () => {
    if (window.confirm('Reset all progress? This cannot be undone.')) {
      setTeamMembers(defaultTeamMembers);
      await saveData(defaultTeamMembers);
    }
  };

  // Login Screen - now only shown as modal
  if (authLoading) {
    return (
      <div style={styles.loadingScreen}>
        <style>{keyframes}</style>
        <div style={styles.loadingText}>LOADING...</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={styles.loadingScreen}>
        <style>{keyframes}</style>
        <div style={styles.loadingText}>CONNECTING TO HQ...</div>
        <div style={styles.loadingSubtext}>Syncing team data</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{keyframes}</style>
      <div style={styles.scanlines} />
      
      {/* User bar */}
      <div style={styles.userBar}>
        <div style={styles.userInfo}>
          {user ? (
            <>
              <span style={styles.userEmail}>👤 {user.email}</span>
              {isAdmin && <span style={styles.adminBadge}>ADMIN</span>}
              {currentUserMember && (
                <span style={styles.userProfile}>
                  {currentUserMember.avatar} {currentUserMember.name}
                </span>
              )}
              {!currentUserMember && !isAdmin && (
                <span style={styles.claimHint}>⚠️ Claim your profile below</span>
              )}
            </>
          ) : (
            <span style={styles.guestText}>👁️ Viewing as guest</span>
          )}
        </div>
        {user ? (
          <button style={styles.signOutBtn} onClick={handleSignOut}>Sign Out</button>
        ) : (
          <button style={styles.signInBtn} onClick={() => setShowLoginModal(true)}>Sign In</button>
        )}
      </div>
      
      <div style={{...styles.connectionStatus, background: isConnected ? 'rgba(0,255,136,0.1)' : 'rgba(255,100,100,0.1)', borderColor: isConnected ? 'rgba(0,255,136,0.3)' : 'rgba(255,100,100,0.3)', color: isConnected ? '#00ff88' : '#ff6b6b'}}>
        <span style={{animation: isConnected ? 'blink 2s infinite' : 'none'}}>●</span>
        {isConnected ? 'LIVE SYNC' : 'OFFLINE MODE'}
        {lastSync && isConnected && <span style={styles.lastSync}>Synced: {lastSync.toLocaleTimeString()}</span>}
      </div>
      
      <header style={styles.header}>
        <div style={styles.headerGlow} />
        <h1 style={styles.title}>
          <span style={styles.titleGlitch}>AGENT OPS</span>
          <span style={styles.titleSub}>HACKATHON 2026</span>
        </h1>
        <div style={styles.countdown}>
          <div style={styles.countdownLabel}>NEXT DEADLINE</div>
          <div style={styles.countdownDate}>{featuredMilestone.date} • {featuredMilestone.title}</div>
          <div style={styles.countdownDesc}>{featuredMilestone.desc} • +{featuredMilestone.xp} XP</div>
        </div>
        {isAdmin && <button style={styles.resetBtn} onClick={resetData}>↺ Reset All</button>}
      </header>

      <div style={styles.mainGrid}>
        <section style={styles.leaderboard}>
          <h2 style={styles.sectionTitle}><span style={styles.sectionIcon}>👑</span> LEADERBOARD</h2>
          <div style={styles.leaderList}>
            {sortedMembers.map((member, idx) => (
              <div key={member.id} style={{...styles.leaderItem, animationDelay: `${idx * 0.05}s`, background: idx === 0 ? 'linear-gradient(90deg, rgba(255,215,0,0.15) 0%, transparent 100%)' : idx === 1 ? 'linear-gradient(90deg, rgba(192,192,192,0.1) 0%, transparent 100%)' : idx === 2 ? 'linear-gradient(90deg, rgba(205,127,50,0.1) 0%, transparent 100%)' : 'transparent'}} onClick={() => setSelectedMember(member)}>
                <span style={{...styles.rank, color: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#8892B0'}}>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}</span>
                <span style={styles.leaderAvatar}>{member.avatar}</span>
                <div style={styles.leaderInfo}>
                  <span style={styles.leaderName}>{member.name} {isOwner(member) && <span style={styles.youBadge}>YOU</span>}</span>
                  <span style={styles.leaderRole}>{member.role}</span>
                </div>
                <div style={styles.leaderStats}>
                  <span style={styles.leaderXP}>{member.xp} XP</span>
                  <span style={styles.leaderLevel}>LVL {member.level}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={styles.timeline}>
          <h2 style={styles.sectionTitle}>
            <span style={styles.sectionIcon}>📍</span> MISSION TIMELINE
            {isAdmin && <span style={styles.sectionHint}>Click milestone to edit</span>}
          </h2>
          <div style={styles.timelineTrack}>
            {(milestones.length > 0 ? milestones : defaultMilestones).map((milestone, idx) => {
              const completedCount = membersWithStats.filter(m => m.completedMilestones?.includes(milestone.id)).length;
              const progress = membersWithStats.length > 0 ? (completedCount / membersWithStats.length) * 100 : 0;
              const isFeatured = milestone.id === activeMilestoneId;
              return (
                <div 
                  key={milestone.id} 
                  style={{
                    ...styles.milestoneCard, 
                    ...(isFeatured ? styles.milestoneActive : {}), 
                    animationDelay: `${idx * 0.15}s`,
                    cursor: isAdmin ? 'pointer' : 'default'
                  }}
                  onClick={() => isAdmin && user && setEditingMilestone({...milestone})}
                >
                  {isAdmin && user && (
                    <button 
                      style={{
                        ...styles.featureBtn,
                        ...(isFeatured ? styles.featureBtnActive : {})
                      }}
                      onClick={(e) => { e.stopPropagation(); setFeaturedMilestone(milestone.id); }}
                      title={isFeatured ? 'Currently featured' : 'Set as featured deadline'}
                    >
                      {isFeatured ? '⭐' : '☆'}
                    </button>
                  )}
                  {isAdmin && <div style={styles.milestoneEditHint}>✏️</div>}
                  <div style={styles.milestoneIcon}>{milestone.icon}</div>
                  <div style={styles.milestoneDate}>{milestone.date}</div>
                  <div style={styles.milestoneTitle}>{milestone.title}</div>
                  <div style={styles.milestoneDesc}>{milestone.desc}</div>
                  <div style={styles.milestoneXP}>+{milestone.xp} XP</div>
                  <div style={styles.milestoneProgress}><div style={{...styles.milestoneProgressBar, width: `${progress}%`}} /></div>
                  <div style={styles.milestoneCount}>{completedCount}/{membersWithStats.length} completed</div>
                </div>
              );
            })}
          </div>
        </section>

        <section style={styles.teamSection}>
          <h2 style={styles.sectionTitle}><span style={styles.sectionIcon}>👾</span> SQUAD STATUS<span style={styles.sectionHint}>{user ? (currentUserMember ? 'Click your card to update' : 'Claim your profile to edit') : 'Sign in to claim your profile'}</span></h2>
          <div style={styles.teamGrid}>
            {membersWithStats.map((member, idx) => {
              const ownsProfile = isOwner(member);
              const canEditMember = canEdit(member);
              const isClaimed = !!member.email;
              return (
                <div key={member.id} style={{...styles.memberCard, animationDelay: `${idx * 0.05}s`, ...(ownsProfile ? styles.memberCardOwner : {})}}>
                  {ownsProfile && <div style={styles.ownerBadge}>YOUR PROFILE</div>}
                  <div style={styles.memberHeader}>
                    <span style={styles.memberAvatar}>{member.avatar}</span>
                    <div style={styles.memberLevel}>LVL {member.level}</div>
                  </div>
                  <div style={styles.memberName}>{member.name}</div>
                  <div style={styles.memberRole}>{member.role}</div>
                  <div style={styles.xpSection}>
                    <div style={styles.xpLabel}><span>{member.xp} XP</span><span style={styles.xpNext}>{getXPForNextLevel(member.xp)} XP</span></div>
                    <div style={styles.xpBar}><div style={{...styles.xpFill, width: `${getXPProgress(member.xp)}%`}} /></div>
                  </div>
                  <div style={styles.streakBadge}>🔥 {member.streak || 0} day streak</div>
                  <div style={styles.badgeRow}>
                    {member.badges?.slice(0, 3).map(badge => <span key={badge} style={styles.badgeIcon} title={badges[badge]?.name}>{badges[badge]?.icon}</span>)}
                    {member.badges?.length > 3 && <span style={styles.badgeMore}>+{member.badges.length - 3}</span>}
                  </div>
                  <div style={styles.workflowCount}>{member.workflows?.length || 0} workflows active</div>
                  <div style={styles.cardActions}>
                    <button style={styles.viewBtn} onClick={() => setSelectedMember(member)}>View</button>
                    {user && canEditMember ? (
                      <button style={ownsProfile ? styles.updateBtn : styles.adminEditBtn} onClick={() => { const baseMember = teamMembers.find(m => m.id === member.id); setEditingMember({...baseMember}); }}>
                        {ownsProfile ? 'Update Status' : '✏️ Edit'}
                      </button>
                    ) : !isClaimed ? (
                      <button style={styles.claimBtn} onClick={() => { if (requireLogin()) claimProfile(member); }}>Claim Profile</button>
                    ) : (
                      <button style={styles.disabledBtn} disabled>Claimed</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* View Detail Modal */}
      {selectedMember && !editingMember && (
        <div style={styles.modalOverlay} onClick={() => setSelectedMember(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => setSelectedMember(null)}>✕</button>
            <div style={styles.modalHeader}>
              <span style={styles.modalAvatar}>{selectedMember.avatar}</span>
              <div><h3 style={styles.modalName}>{selectedMember.name} {isOwner(selectedMember) && <span style={styles.youBadge}>YOU</span>}</h3><p style={styles.modalRole}>{selectedMember.role}</p></div>
            </div>
            <div style={styles.modalStats}>
              <div style={styles.modalStat}><div style={styles.modalStatValue}>{selectedMember.xp}</div><div style={styles.modalStatLabel}>TOTAL XP</div></div>
              <div style={styles.modalStat}><div style={styles.modalStatValue}>{selectedMember.level}</div><div style={styles.modalStatLabel}>LEVEL</div></div>
              <div style={styles.modalStat}><div style={styles.modalStatValue}>{selectedMember.streak || 0}</div><div style={styles.modalStatLabel}>DAY STREAK</div></div>
            </div>
            <div style={styles.modalSection}>
              <h4 style={styles.modalSectionTitle}>🏅 BADGES EARNED</h4>
              <div style={styles.modalBadges}>{selectedMember.badges?.length > 0 ? selectedMember.badges.map(badge => <div key={badge} style={styles.modalBadge}><span style={styles.modalBadgeIcon}>{badges[badge]?.icon}</span><span style={styles.modalBadgeName}>{badges[badge]?.name}</span></div>) : <span style={styles.noBadges}>No badges yet</span>}</div>
            </div>
            <div style={styles.modalSection}>
              <h4 style={styles.modalSectionTitle}>⚡ ACTIVE WORKFLOWS</h4>
              <div style={styles.modalWorkflows}>
                {selectedMember.workflows?.length > 0 ? selectedMember.workflows.map((wf, i) => {
                  const media = getWorkflowMedia(wf);
                  return (
                    <div 
                      key={i} 
                      style={{
                        ...styles.modalWorkflowCard,
                        cursor: media ? 'pointer' : 'default'
                      }}
                      onClick={() => media && setViewingWorkflow(wf)}
                    >
                      {media && (
                        <div style={styles.workflowThumbnail}>
                          {media.type === 'image' ? (
                            <img src={media.url} alt="" style={styles.workflowThumbMedia} />
                          ) : ['youtube', 'loom'].includes(media.type) && getVideoThumbnail(media.url, media.type) ? (
                            <img src={getVideoThumbnail(media.url, media.type)} alt="" style={styles.workflowThumbMedia} />
                          ) : (
                            <div style={styles.workflowThumbPlaceholder}>
                              <span style={styles.workflowThumbIcon}>
                                {media.type === 'youtube' ? '📺' : media.type === 'loom' ? '🎥' : media.type === 'vimeo' ? '🎬' : media.type === 'slack' ? '💬' : '🔗'}
                              </span>
                              <span style={styles.workflowThumbLabel}>
                                {media.type === 'youtube' ? 'YouTube' : media.type === 'loom' ? 'Loom' : media.type === 'vimeo' ? 'Vimeo' : media.type === 'slack' ? 'Slack' : 'View'}
                              </span>
                            </div>
                          )}
                          <div style={styles.workflowMediaIcon}>
                            {media.type === 'youtube' ? '📺' : media.type === 'loom' ? '🎥' : media.type === 'image' ? '🖼️' : media.type === 'slack' ? '💬' : '🔗'}
                          </div>
                        </div>
                      )}
                      <div style={styles.workflowCardContent}>
                        <span style={styles.workflowDot}>●</span>
                        <span style={styles.workflowCardName}>{getWorkflowName(wf)}</span>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          {wf.attachments && wf.attachments.length > 0 && (
                            <span style={styles.attachmentBadge}>📎 {wf.attachments.length}</span>
                          )}
                          {media && <span style={styles.viewMediaHint}>Click to view</span>}
                        </div>
                      </div>
                    </div>
                  );
                }) : <span style={styles.noBadges}>No workflows yet</span>}
              </div>
            </div>
            <div style={styles.modalSection}>
              <h4 style={styles.modalSectionTitle}>📍 MILESTONES</h4>
              <div style={styles.modalMilestones}>{(milestones.length > 0 ? milestones : defaultMilestones).map(m => <div key={m.id} style={{...styles.modalMilestone, opacity: selectedMember.completedMilestones?.includes(m.id) ? 1 : 0.4}}><span>{selectedMember.completedMilestones?.includes(m.id) ? '✅' : '⬜'}</span><span>{m.title}</span><span style={styles.milestoneXPSmall}>+{m.xp} XP</span></div>)}</div>
            </div>
            {user && canEdit(selectedMember) && (
              <button style={styles.editFromViewBtn} onClick={() => { const baseMember = teamMembers.find(m => m.id === selectedMember.id); setEditingMember({...baseMember}); setSelectedMember(null); }}>
                {isOwner(selectedMember) ? '✏️ Update My Status' : '✏️ Edit (Admin)'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingMember && (
        <div style={styles.modalOverlay} onClick={() => setEditingMember(null)}>
          <div style={{...styles.modal, ...styles.editModal}} onClick={e => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => setEditingMember(null)}>✕</button>
            <div style={styles.modalHeader}>
              <span style={styles.modalAvatar}>{editingMember.avatar}</span>
              <div><h3 style={styles.modalName}>{editingMember.name}</h3><p style={styles.modalRole}>Update Your Progress</p></div>
            </div>
            <div style={styles.editSection}>
              <h4 style={styles.editSectionTitle}>📍 MILESTONES COMPLETED</h4>
              <div style={styles.milestoneToggles}>
                {(milestones.length > 0 ? milestones : defaultMilestones).map(m => (
                  <button key={m.id} style={{...styles.milestoneToggle, ...(editingMember.completedMilestones?.includes(m.id) ? styles.milestoneToggleActive : {})}} onClick={() => toggleMilestone(m.id)}>
                    <span style={styles.toggleIcon}>{editingMember.completedMilestones?.includes(m.id) ? '✅' : '⬜'}</span>
                    <span style={styles.toggleInfo}><span style={styles.toggleTitle}>{m.title}</span><span style={styles.toggleDate}>{m.date} • +{m.xp} XP</span></span>
                  </button>
                ))}
              </div>
              <div style={styles.xpPreview}>Projected XP: <span style={styles.xpPreviewValue}>{calculateXP(editingMember.completedMilestones || [])}</span></div>
            </div>
            <div style={styles.editSection}>
              <h4 style={styles.editSectionTitle}>🔥 DAILY STREAK</h4>
              <div style={styles.streakControl}>
                <button style={styles.streakBtn} onClick={() => updateStreak(-1)}>−</button>
                <span style={styles.streakValue}>{editingMember.streak || 0}</span>
                <button style={styles.streakBtn} onClick={() => updateStreak(1)}>+</button>
              </div>
            </div>
            <div style={styles.editSection}>
              <h4 style={styles.editSectionTitle}>⚡ MY WORKFLOWS</h4>
              <div style={styles.workflowList}>
                {(editingMember.workflows || []).map((wf, i) => {
                  const media = getWorkflowMedia(wf);
                  return (
                    <div key={i} style={styles.workflowItemWithMedia}>
                      {media && (
                        <div style={styles.workflowItemThumb}>
                          {media.type === 'image' ? (
                            <img src={media.url} alt="" style={styles.workflowItemThumbMedia} />
                          ) : ['youtube', 'loom'].includes(media.type) && getVideoThumbnail(media.url, media.type) ? (
                            <img src={getVideoThumbnail(media.url, media.type)} alt="" style={styles.workflowItemThumbMedia} />
                          ) : (
                            <div style={styles.workflowItemThumbIcon}>
                              {media.type === 'youtube' ? '📺' : media.type === 'loom' ? '🎥' : media.type === 'slack' ? '💬' : '🔗'}
                            </div>
                          )}
                        </div>
                      )}
                      <span style={styles.workflowItemName}>{getWorkflowName(wf)}</span>
                      <button style={styles.removeWorkflowBtn} onClick={() => removeWorkflow(i)}>✕</button>
                    </div>
                  );
                })}
              </div>
              <div style={styles.addWorkflowSection}>
                <input 
                  type="text" 
                  placeholder="Workflow name..." 
                  value={newWorkflow} 
                  onChange={(e) => setNewWorkflow(e.target.value)} 
                  style={styles.workflowInput} 
                />
                <input 
                  type="text" 
                  placeholder="🔗 Media URL (YouTube, Loom, image link - optional)" 
                  value={workflowMediaUrl} 
                  onChange={(e) => setWorkflowMediaUrl(e.target.value)} 
                  style={styles.workflowUrlInput} 
                />
                {workflowMediaUrl && (
                  <div style={styles.mediaPreviewHint}>
                    {detectMediaType(workflowMediaUrl) === 'slack' && '💬 Slack media detected'}
                    {detectMediaType(workflowMediaUrl) === 'youtube' && '📺 YouTube video detected'}
                    {detectMediaType(workflowMediaUrl) === 'loom' && '🎥 Loom video detected'}
                    {detectMediaType(workflowMediaUrl) === 'vimeo' && '🎬 Vimeo video detected'}
                    {detectMediaType(workflowMediaUrl) === 'image' && '🖼️ Image detected'}
                    {detectMediaType(workflowMediaUrl) === 'video' && '🎬 Video detected'}
                    {detectMediaType(workflowMediaUrl) === 'gdrive' && '📁 Google Drive link detected'}
                    {detectMediaType(workflowMediaUrl) === 'link' && '🔗 Link added'}
                  </div>
                )}
                <button 
                  style={styles.addWorkflowBtn} 
                  onClick={addWorkflow}
                >
                  + Add Workflow
                </button>
              </div>
            </div>
            <div style={styles.editActions}>
              <button style={styles.cancelBtn} onClick={() => setEditingMember(null)}>Cancel</button>
              <button style={styles.saveBtn} onClick={saveEdits}>💾 Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div style={styles.modalOverlay} onClick={() => setShowLoginModal(false)}>
          <div style={styles.loginModalBox} onClick={e => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => setShowLoginModal(false)}>✕</button>
            <div style={styles.loginHeader}>
              <h1 style={styles.loginModalTitle}>SIGN IN</h1>
              <p style={styles.loginModalSubtitle}>to claim your profile & track progress</p>
            </div>
            
            <form onSubmit={authMode === 'login' ? handleLogin : authMode === 'signup' ? handleSignup : handlePasswordReset}>
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>EMAIL</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  style={styles.input}
                  placeholder="your@email.com"
                  required
                />
              </div>
              
              {authMode !== 'reset' && (
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>PASSWORD</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    style={styles.input}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              )}
              
              {authError && <div style={styles.authError}>{authError}</div>}
              {authSuccess && <div style={styles.authSuccess}>{authSuccess}</div>}
              
              <button type="submit" style={styles.loginBtn}>
                {authMode === 'login' ? '🚀 LOGIN' : authMode === 'signup' ? '✨ CREATE ACCOUNT' : '📧 SEND RESET EMAIL'}
              </button>
            </form>

            <div style={styles.authLinks}>
              {authMode === 'login' ? (
                <>
                  <button style={styles.authLink} onClick={() => { setAuthMode('signup'); setAuthError(''); setAuthSuccess(''); }}>
                    Need an account? Sign up
                  </button>
                  <button style={styles.authLink} onClick={() => { setAuthMode('reset'); setAuthError(''); setAuthSuccess(''); }}>
                    Forgot password?
                  </button>
                </>
              ) : (
                <button style={styles.authLink} onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}>
                  ← Back to login
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Milestone Modal (Admin only) */}
      {editingMilestone && isAdmin && (
        <div style={styles.modalOverlay} onClick={() => setEditingMilestone(null)}>
          <div style={{...styles.modal, ...styles.editModal}} onClick={e => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => setEditingMilestone(null)}>✕</button>
            <div style={styles.modalHeader}>
              <span style={styles.modalAvatar}>{editingMilestone.icon}</span>
              <div><h3 style={styles.modalName}>Edit Milestone</h3><p style={styles.modalRole}>Admin Only</p></div>
            </div>
            
            <div style={styles.editSection}>
              <h4 style={styles.editSectionTitle}>📅 DATE</h4>
              <input
                type="text"
                value={editingMilestone.date}
                onChange={(e) => setEditingMilestone({...editingMilestone, date: e.target.value})}
                style={styles.milestoneInput}
                placeholder="e.g. JAN 15"
              />
            </div>

            <div style={styles.editSection}>
              <h4 style={styles.editSectionTitle}>📝 TITLE</h4>
              <input
                type="text"
                value={editingMilestone.title}
                onChange={(e) => setEditingMilestone({...editingMilestone, title: e.target.value.toUpperCase()})}
                style={styles.milestoneInput}
                placeholder="e.g. WORKSHOP"
              />
            </div>

            <div style={styles.editSection}>
              <h4 style={styles.editSectionTitle}>📋 DESCRIPTION</h4>
              <input
                type="text"
                value={editingMilestone.desc}
                onChange={(e) => setEditingMilestone({...editingMilestone, desc: e.target.value})}
                style={styles.milestoneInput}
                placeholder="e.g. Live Workflow Demo"
              />
            </div>

            <div style={styles.editSection}>
              <h4 style={styles.editSectionTitle}>⭐ XP REWARD</h4>
              <input
                type="number"
                value={editingMilestone.xp}
                onChange={(e) => setEditingMilestone({...editingMilestone, xp: parseInt(e.target.value) || 0})}
                style={styles.milestoneInput}
                placeholder="e.g. 100"
                min="0"
                step="50"
              />
            </div>

            <div style={styles.editSection}>
              <h4 style={styles.editSectionTitle}>🎨 ICON</h4>
              <div style={styles.iconPicker}>
                {milestoneIcons.map(icon => (
                  <button
                    key={icon}
                    style={{
                      ...styles.iconOption,
                      ...(editingMilestone.icon === icon ? styles.iconOptionSelected : {})
                    }}
                    onClick={() => setEditingMilestone({...editingMilestone, icon})}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.editActions}>
              <button style={styles.cancelBtn} onClick={() => setEditingMilestone(null)}>Cancel</button>
              <button style={styles.saveBtn} onClick={() => updateMilestone(editingMilestone)}>💾 Save Milestone</button>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Media Viewer Modal */}
      {viewingWorkflow && (
        <div style={styles.modalOverlay} onClick={() => setViewingWorkflow(null)}>
          <div style={styles.mediaViewerModal} onClick={e => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => setViewingWorkflow(null)}>✕</button>
            <div style={styles.mediaViewerContent}>
              {(() => {
                const media = getWorkflowMedia(viewingWorkflow);
                if (!media) return null;

                // YouTube, Loom, Vimeo - use iframe embed
                if (['youtube', 'loom', 'vimeo'].includes(media.type)) {
                  return (
                    <iframe
                      src={getEmbedUrl(media.url, media.type)}
                      style={styles.mediaViewerIframe}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={getWorkflowName(viewingWorkflow)}
                    />
                  );
                }

                // Direct video file
                if (media.type === 'video') {
                  return (
                    <video
                      src={media.url}
                      style={styles.mediaViewerVideo}
                      controls
                      autoPlay
                    />
                  );
                }

                // Image
                if (media.type === 'image') {
                  return (
                    <img
                      src={media.url}
                      alt={getWorkflowName(viewingWorkflow)}
                      style={styles.mediaViewerImage}
                    />
                  );
                }

                // Slack media - show thread discussion
                if (media.type === 'slack') {
                  if (loadingSlackThread) {
                    return (
                      <div style={styles.slackThreadLoading}>
                        <div style={styles.loadingSpinner}>⏳</div>
                        <p>Loading Slack thread...</p>
                      </div>
                    );
                  }

                  if (slackThread && slackThread.error) {
                    return (
                      <div style={styles.slackThreadError}>
                        <p style={styles.errorTitle}>⚠️ Failed to load thread</p>
                        <p style={styles.errorMessage}>{slackThread.error}</p>
                        <a
                          href={media.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.mediaViewerLinkBtn}
                        >
                          💬 Open in Slack
                        </a>
                      </div>
                    );
                  }

                  if (slackThread && slackThread.messages) {
                    return (
                      <div style={styles.slackThreadContainer}>
                        <div style={styles.slackThreadHeader}>
                          <span style={styles.slackThreadBadge}>💬 Slack Thread</span>
                          <a
                            href={media.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.slackOpenLink}
                          >
                            Open in Slack ↗
                          </a>
                        </div>
                        <div style={styles.slackMessages}>
                          {slackThread.messages.map((msg, idx) => (
                            <div key={idx} style={styles.slackMessage}>
                              <div style={styles.slackMessageHeader}>
                                {msg.user.avatar ? (
                                  <img
                                    src={msg.user.avatar}
                                    alt={msg.user.name}
                                    style={styles.slackAvatar}
                                  />
                                ) : (
                                  <div style={styles.slackAvatarPlaceholder}>
                                    {msg.user.display_name?.[0] || '?'}
                                  </div>
                                )}
                                <div style={styles.slackMessageInfo}>
                                  <span style={styles.slackUsername}>{msg.user.display_name || msg.user.name}</span>
                                  <span style={styles.slackTimestamp}>
                                    {new Date(parseFloat(msg.timestamp) * 1000).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <div style={styles.slackMessageText}>{msg.text}</div>
                            </div>
                          ))}
                        </div>
                        {viewingWorkflow.attachments && viewingWorkflow.attachments.length > 0 && (
                          <div style={styles.slackAttachmentsSection}>
                            <h4 style={styles.slackAttachmentsTitle}>📎 Attachments ({viewingWorkflow.attachments.length})</h4>
                            <div style={styles.slackAttachments}>
                              {viewingWorkflow.attachments.map((attachment, idx) => (
                                <a
                                  key={idx}
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={styles.slackAttachment}
                                >
                                  {attachment.thumbnail ? (
                                    <img src={attachment.thumbnail} alt={attachment.name} style={styles.slackAttachmentThumb} />
                                  ) : (
                                    <div style={styles.slackAttachmentIcon}>
                                      {attachment.filetype === 'pdf' ? '📄' :
                                       attachment.filetype === 'video' ? '🎥' :
                                       attachment.filetype === 'audio' ? '🎵' :
                                       '📎'}
                                    </div>
                                  )}
                                  <div style={styles.slackAttachmentInfo}>
                                    <div style={styles.slackAttachmentName}>{attachment.name || attachment.title}</div>
                                    <div style={styles.slackAttachmentMeta}>
                                      {attachment.filetype && <span>{attachment.filetype.toUpperCase()}</span>}
                                      {attachment.size && <span> • {(attachment.size / 1024).toFixed(0)} KB</span>}
                                    </div>
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div style={styles.mediaViewerLink}>
                      <a
                        href={media.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.mediaViewerLinkBtn}
                      >
                        💬 Open in Slack
                      </a>
                      <p style={styles.mediaViewerLinkHint}>Opens in new tab</p>
                    </div>
                  );
                }

                // Google Drive or other links - show link button
                return (
                  <div style={styles.mediaViewerLink}>
                    <a
                      href={media.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.mediaViewerLinkBtn}
                    >
                      🔗 Open Link
                    </a>
                    <p style={styles.mediaViewerLinkHint}>Opens in new tab</p>
                  </div>
                );
              })()}
            </div>
            <h3 style={styles.mediaViewerTitle}>{getWorkflowName(viewingWorkflow)}</h3>
          </div>
        </div>
      )}

      <footer style={styles.footer}>
        <div style={styles.footerStat}><span style={styles.footerValue}>{membersWithStats.length}</span><span style={styles.footerLabel}>AGENTS</span></div>
        <div style={styles.footerStat}><span style={styles.footerValue}>{membersWithStats.reduce((a, m) => a + (m.workflows?.length || 0), 0)}</span><span style={styles.footerLabel}>WORKFLOWS</span></div>
        <div style={styles.footerStat}><span style={styles.footerValue}>{membersWithStats.reduce((a, m) => a + m.xp, 0)}</span><span style={styles.footerLabel}>TOTAL XP</span></div>
        <div style={styles.footerStat}><span style={styles.footerValue}>{Math.round(membersWithStats.reduce((a, m) => a + (m.completedMilestones?.length || 0), 0) / (membersWithStats.length * (milestones.length || defaultMilestones.length)) * 100) || 0}%</span><span style={styles.footerLabel}>PROGRESS</span></div>
      </footer>
    </div>
  );
};

const keyframes = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap');
  @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
  @keyframes glitch { 0%, 90%, 100% { transform: translateX(0); } 92% { transform: translateX(-2px); } 94% { transform: translateX(2px); } 96% { transform: translateX(-1px); } 98% { transform: translateX(1px); } }
  @keyframes borderGlow { 0%, 100% { border-color: #00ff88; } 50% { border-color: #00ccff; } }
  @keyframes loadingPulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
  @keyframes blink { 0%, 50%, 100% { opacity: 1; } 25%, 75% { opacity: 0.3; } }
`;

const styles = {
  // Login styles
  loginContainer: { minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Rajdhani", sans-serif' },
  loginBox: { background: 'rgba(20, 20, 35, 0.9)', border: '2px solid #00ff88', borderRadius: '16px', padding: '40px', maxWidth: '400px', width: '90%', boxShadow: '0 0 60px rgba(0,255,136,0.2)' },
  loginHeader: { textAlign: 'center', marginBottom: '30px' },
  loginTitle: { fontFamily: '"Orbitron", sans-serif', fontSize: '2.5rem', fontWeight: 900, background: 'linear-gradient(90deg, #00ff88, #00ccff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 },
  loginSubtitle: { fontFamily: '"Share Tech Mono", monospace', fontSize: '1rem', color: '#00ff88', letterSpacing: '0.3em', marginTop: '5px', content: '"HACKATHON 2026"' },
  inputGroup: { marginBottom: '20px' },
  inputLabel: { display: 'block', fontFamily: '"Share Tech Mono", monospace', fontSize: '0.75rem', color: '#00ccff', marginBottom: '8px', letterSpacing: '0.1em' },
  input: { width: '100%', padding: '12px 15px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '8px', color: '#fff', fontSize: '1rem', fontFamily: '"Rajdhani", sans-serif', boxSizing: 'border-box' },
  authError: { background: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.3)', color: '#ff6b6b', padding: '10px 15px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.85rem' },
  authSuccess: { background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', color: '#00ff88', padding: '10px 15px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.85rem' },
  loginBtn: { width: '100%', padding: '14px', background: 'linear-gradient(90deg, #00ff88, #00ccff)', border: 'none', borderRadius: '8px', color: '#0a0a0f', fontSize: '1.1rem', fontFamily: '"Orbitron", sans-serif', fontWeight: 700, cursor: 'pointer' },
  authLinks: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px', alignItems: 'center' },
  authLink: { background: 'none', border: 'none', color: '#00ccff', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' },
  loginNote: { marginTop: '25px', padding: '15px', background: 'rgba(0,204,255,0.1)', borderRadius: '8px', fontSize: '0.8rem', color: '#888', textAlign: 'center', lineHeight: 1.5 },
  
  // User bar
  userBar: { position: 'fixed', top: 0, left: 0, right: 0, background: 'rgba(10,10,15,0.95)', borderBottom: '1px solid rgba(0,255,136,0.2)', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 },
  userInfo: { display: 'flex', alignItems: 'center', gap: '15px' },
  userEmail: { fontFamily: '"Share Tech Mono", monospace', fontSize: '0.85rem', color: '#888' },
  userProfile: { fontFamily: '"Rajdhani", sans-serif', fontSize: '0.9rem', color: '#00ff88', fontWeight: 600 },
  claimHint: { fontSize: '0.8rem', color: '#ff6b35' },
  signOutBtn: { padding: '8px 16px', background: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.3)', borderRadius: '6px', color: '#ff6b6b', cursor: 'pointer', fontFamily: '"Share Tech Mono", monospace', fontSize: '0.8rem' },
  signInBtn: { padding: '8px 20px', background: 'linear-gradient(90deg, #00ff88, #00ccff)', border: 'none', borderRadius: '6px', color: '#0a0a0f', cursor: 'pointer', fontFamily: '"Orbitron", sans-serif', fontSize: '0.8rem', fontWeight: 700 },
  guestText: { fontFamily: '"Share Tech Mono", monospace', fontSize: '0.85rem', color: '#888' },
  loginModalBox: { background: 'linear-gradient(145deg, #1a1a2e 0%, #0f0f1a 100%)', border: '2px solid #00ff88', borderRadius: '16px', padding: '30px', maxWidth: '400px', width: '90%', position: 'relative', boxShadow: '0 0 60px rgba(0,255,136,0.3)' },
  loginModalTitle: { fontFamily: '"Orbitron", sans-serif', fontSize: '1.8rem', fontWeight: 900, color: '#00ff88', margin: 0, textAlign: 'center' },
  loginModalSubtitle: { fontFamily: '"Rajdhani", sans-serif', fontSize: '0.9rem', color: '#888', marginTop: '5px', textAlign: 'center' },
  youBadge: { background: '#00ff88', color: '#0a0a0f', padding: '2px 6px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 700, marginLeft: '8px', verticalAlign: 'middle' },
  adminBadge: { background: 'linear-gradient(90deg, #ff00ff, #00ccff)', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, marginLeft: '10px', fontFamily: '"Orbitron", sans-serif' },

  // Main styles
  container: { minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%)', fontFamily: '"Rajdhani", sans-serif', color: '#e0e0e0', padding: '70px 20px 20px', position: 'relative', overflow: 'hidden' },
  loadingScreen: { minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  loadingText: { fontFamily: '"Orbitron", sans-serif', fontSize: '1.5rem', color: '#00ff88', animation: 'loadingPulse 1s infinite' },
  loadingSubtext: { fontFamily: '"Share Tech Mono", monospace', fontSize: '0.9rem', color: '#666' },
  connectionStatus: { position: 'fixed', top: '60px', left: '20px', padding: '8px 16px', borderRadius: '20px', border: '1px solid', fontFamily: '"Share Tech Mono", monospace', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 99 },
  lastSync: { marginLeft: '10px', opacity: 0.6, fontSize: '0.7rem' },
  scanlines: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)', pointerEvents: 'none', zIndex: 1000 },
  header: { textAlign: 'center', padding: '30px 20px', position: 'relative', marginBottom: '30px' },
  headerGlow: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '200px', background: 'radial-gradient(ellipse, rgba(0,255,136,0.15) 0%, transparent 70%)', pointerEvents: 'none' },
  title: { margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' },
  titleGlitch: { fontFamily: '"Orbitron", sans-serif', fontSize: '3.5rem', fontWeight: 900, background: 'linear-gradient(90deg, #00ff88, #00ccff, #ff00ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.1em', animation: 'glitch 3s infinite' },
  titleSub: { fontFamily: '"Share Tech Mono", monospace', fontSize: '1.2rem', color: '#00ff88', letterSpacing: '0.5em', opacity: 0.8 },
  countdown: { marginTop: '20px', padding: '15px 30px', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '8px', display: 'inline-block' },
  countdownLabel: { fontFamily: '"Share Tech Mono", monospace', fontSize: '0.75rem', color: '#888', letterSpacing: '0.2em' },
  countdownDate: { fontFamily: '"Orbitron", sans-serif', fontSize: '1.3rem', color: '#00ff88', fontWeight: 700, animation: 'pulse 2s infinite' },
  countdownDesc: { fontFamily: '"Rajdhani", sans-serif', fontSize: '0.85rem', color: '#888', marginTop: '5px' },
  resetBtn: { position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.3)', color: '#ff6b6b', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontFamily: '"Share Tech Mono", monospace', fontSize: '0.8rem' },
  mainGrid: { display: 'grid', gridTemplateColumns: '300px 1fr', gridTemplateRows: 'auto 1fr', gap: '25px', maxWidth: '1400px', margin: '0 auto' },
  sectionTitle: { fontFamily: '"Orbitron", sans-serif', fontSize: '1rem', fontWeight: 700, color: '#00ccff', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '0.1em' },
  sectionIcon: { fontSize: '1.2rem' },
  sectionHint: { fontSize: '0.7rem', color: '#666', fontFamily: '"Rajdhani", sans-serif', fontWeight: 400, marginLeft: 'auto' },
  leaderboard: { gridRow: 'span 2', background: 'rgba(20, 20, 35, 0.8)', border: '1px solid rgba(0, 204, 255, 0.2)', borderRadius: '12px', padding: '20px', backdropFilter: 'blur(10px)', maxHeight: '80vh', overflowY: 'auto' },
  leaderList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  leaderItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'all 0.3s ease', animation: 'slideIn 0.5s ease forwards', opacity: 0 },
  rank: { fontFamily: '"Orbitron", sans-serif', fontSize: '0.8rem', fontWeight: 700, width: '30px', textAlign: 'center' },
  leaderAvatar: { fontSize: '1.5rem' },
  leaderInfo: { flex: 1, display: 'flex', flexDirection: 'column' },
  leaderName: { fontSize: '0.85rem', fontWeight: 600, color: '#fff' },
  leaderRole: { fontSize: '0.7rem', color: '#888' },
  leaderStats: { textAlign: 'right', display: 'flex', flexDirection: 'column' },
  leaderXP: { fontFamily: '"Share Tech Mono", monospace', fontSize: '0.8rem', color: '#00ff88', fontWeight: 600 },
  leaderLevel: { fontSize: '0.65rem', color: '#666' },
  timeline: { background: 'rgba(20, 20, 35, 0.8)', border: '1px solid rgba(0, 204, 255, 0.2)', borderRadius: '12px', padding: '20px', backdropFilter: 'blur(10px)' },
  timelineTrack: { display: 'flex', gap: '15px', overflowX: 'auto', padding: '10px 0' },
  milestoneCard: { minWidth: '140px', background: 'rgba(30, 30, 50, 0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '15px', textAlign: 'center', transition: 'all 0.3s ease', animation: 'slideIn 0.5s ease forwards', opacity: 0, position: 'relative' },
  milestoneActive: { border: '2px solid #00ff88', animation: 'slideIn 0.5s ease forwards, borderGlow 2s infinite', boxShadow: '0 0 20px rgba(0,255,136,0.3)' },
  milestoneIcon: { fontSize: '2rem', marginBottom: '8px' },
  milestoneDate: { fontFamily: '"Share Tech Mono", monospace', fontSize: '0.7rem', color: '#00ccff', letterSpacing: '0.1em' },
  milestoneTitle: { fontFamily: '"Orbitron", sans-serif', fontSize: '0.8rem', fontWeight: 700, color: '#fff', margin: '5px 0' },
  milestoneDesc: { fontSize: '0.7rem', color: '#888', marginBottom: '8px' },
  milestoneXP: { fontFamily: '"Share Tech Mono", monospace', fontSize: '0.8rem', color: '#00ff88', fontWeight: 600 },
  milestoneProgress: { height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', margin: '10px 0 5px', overflow: 'hidden' },
  milestoneProgressBar: { height: '100%', background: 'linear-gradient(90deg, #00ff88, #00ccff)', borderRadius: '2px', transition: 'width 1s ease' },
  milestoneCount: { fontSize: '0.65rem', color: '#666' },
  milestoneEditHint: { position: 'absolute', top: '5px', right: '5px', fontSize: '0.7rem', opacity: 0.5 },
  featureBtn: { position: 'absolute', top: '5px', left: '5px', fontSize: '1rem', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, transition: 'all 0.2s ease', padding: '2px' },
  featureBtnActive: { opacity: 1, color: '#FFD700', textShadow: '0 0 10px rgba(255,215,0,0.5)' },
  milestoneInput: { width: '100%', padding: '12px 15px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '8px', color: '#fff', fontSize: '1rem', fontFamily: '"Rajdhani", sans-serif', boxSizing: 'border-box' },
  iconPicker: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  iconOption: { width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', background: 'rgba(255,255,255,0.05)', border: '2px solid transparent', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' },
  iconOptionSelected: { background: 'rgba(0,255,136,0.2)', borderColor: '#00ff88' },
  teamSection: { background: 'rgba(20, 20, 35, 0.8)', border: '1px solid rgba(0, 204, 255, 0.2)', borderRadius: '12px', padding: '20px', backdropFilter: 'blur(10px)' },
  teamGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' },
  memberCard: { background: 'linear-gradient(145deg, rgba(30,30,50,0.8) 0%, rgba(20,20,35,0.9) 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '15px', transition: 'all 0.3s ease', animation: 'slideIn 0.5s ease forwards', opacity: 0, position: 'relative' },
  memberCardOwner: { border: '2px solid #00ff88', boxShadow: '0 0 20px rgba(0,255,136,0.2)' },
  ownerBadge: { position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#00ff88', color: '#0a0a0f', padding: '3px 10px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 700, fontFamily: '"Orbitron", sans-serif' },
  memberHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' },
  memberAvatar: { fontSize: '2rem' },
  memberLevel: { fontFamily: '"Orbitron", sans-serif', fontSize: '0.65rem', fontWeight: 700, color: '#00ff88', background: 'rgba(0,255,136,0.15)', padding: '3px 6px', borderRadius: '4px' },
  memberName: { fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '2px' },
  memberRole: { fontSize: '0.75rem', color: '#00ccff', marginBottom: '10px' },
  xpSection: { marginBottom: '10px' },
  xpLabel: { display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '4px' },
  xpNext: { color: '#555' },
  xpBar: { height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' },
  xpFill: { height: '100%', background: 'linear-gradient(90deg, #00ff88, #00ccff)', borderRadius: '3px', transition: 'width 1s ease' },
  streakBadge: { fontSize: '0.75rem', color: '#ff6b35', marginBottom: '8px' },
  badgeRow: { display: 'flex', gap: '5px', marginBottom: '8px' },
  badgeIcon: { fontSize: '1rem', cursor: 'help' },
  badgeMore: { fontSize: '0.65rem', color: '#666', alignSelf: 'center' },
  workflowCount: { fontFamily: '"Share Tech Mono", monospace', fontSize: '0.7rem', color: '#888', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', marginBottom: '10px' },
  cardActions: { display: 'flex', gap: '6px' },
  viewBtn: { flex: 1, padding: '6px', background: 'rgba(0,204,255,0.1)', border: '1px solid rgba(0,204,255,0.3)', borderRadius: '5px', color: '#00ccff', cursor: 'pointer', fontFamily: '"Rajdhani", sans-serif', fontWeight: 600, fontSize: '0.8rem' },
  updateBtn: { flex: 1, padding: '6px', background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.4)', borderRadius: '5px', color: '#00ff88', cursor: 'pointer', fontFamily: '"Rajdhani", sans-serif', fontWeight: 600, fontSize: '0.8rem' },
  adminEditBtn: { flex: 1, padding: '6px', background: 'rgba(255,0,255,0.15)', border: '1px solid rgba(255,0,255,0.4)', borderRadius: '5px', color: '#ff00ff', cursor: 'pointer', fontFamily: '"Rajdhani", sans-serif', fontWeight: 600, fontSize: '0.8rem' },
  claimBtn: { flex: 1, padding: '6px', background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.4)', borderRadius: '5px', color: '#ffd700', cursor: 'pointer', fontFamily: '"Rajdhani", sans-serif', fontWeight: 600, fontSize: '0.8rem' },
  disabledBtn: { flex: 1, padding: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '5px', color: '#555', cursor: 'not-allowed', fontFamily: '"Rajdhani", sans-serif', fontWeight: 600, fontSize: '0.8rem' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(5px)' },
  modal: { background: 'linear-gradient(145deg, #1a1a2e 0%, #0f0f1a 100%)', border: '2px solid #00ff88', borderRadius: '16px', padding: '30px', maxWidth: '500px', width: '90%', maxHeight: '85vh', overflow: 'auto', position: 'relative', boxShadow: '0 0 60px rgba(0,255,136,0.3)' },
  editModal: { maxWidth: '550px' },
  modalClose: { position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#888', fontSize: '1.5rem', cursor: 'pointer' },
  modalHeader: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' },
  modalAvatar: { fontSize: '4rem' },
  modalName: { fontFamily: '"Orbitron", sans-serif', fontSize: '1.5rem', fontWeight: 700, color: '#fff', margin: 0 },
  modalRole: { color: '#00ccff', margin: '5px 0 0 0' },
  modalStats: { display: 'flex', gap: '20px', marginBottom: '25px', padding: '15px', background: 'rgba(0,255,136,0.05)', borderRadius: '8px' },
  modalStat: { flex: 1, textAlign: 'center' },
  modalStatValue: { fontFamily: '"Orbitron", sans-serif', fontSize: '1.8rem', fontWeight: 700, color: '#00ff88' },
  modalStatLabel: { fontFamily: '"Share Tech Mono", monospace', fontSize: '0.65rem', color: '#666', letterSpacing: '0.1em' },
  modalSection: { marginBottom: '20px' },
  modalSectionTitle: { fontFamily: '"Orbitron", sans-serif', fontSize: '0.85rem', fontWeight: 600, color: '#00ccff', margin: '0 0 12px 0' },
  modalBadges: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
  modalBadge: { display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '20px' },
  modalBadgeIcon: { fontSize: '1.2rem' },
  modalBadgeName: { fontSize: '0.8rem', color: '#ccc' },
  noBadges: { color: '#555', fontSize: '0.85rem', fontStyle: 'italic' },
  modalWorkflows: { display: 'flex', flexDirection: 'column', gap: '10px' },
  modalWorkflow: { fontSize: '0.9rem', color: '#e0e0e0', display: 'flex', alignItems: 'center', gap: '8px' },
  modalWorkflowCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', transition: 'all 0.2s ease' },
  workflowThumbnail: { width: '100%', height: '120px', borderRadius: '6px', overflow: 'hidden', marginBottom: '8px', position: 'relative', background: 'rgba(0,0,0,0.3)' },
  workflowThumbMedia: { width: '100%', height: '100%', objectFit: 'cover' },
  workflowThumbPlaceholder: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(0,204,255,0.1) 0%, rgba(0,255,136,0.1) 100%)' },
  workflowThumbIcon: { fontSize: '2rem', marginBottom: '5px' },
  workflowThumbLabel: { fontSize: '0.75rem', color: '#888' },
  workflowMediaIcon: { position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.7)', borderRadius: '4px', padding: '2px 6px', fontSize: '0.8rem' },
  workflowCardContent: { display: 'flex', alignItems: 'center', gap: '8px' },
  workflowCardName: { flex: 1, fontSize: '0.9rem', color: '#e0e0e0' },
  viewMediaHint: { fontSize: '0.7rem', color: '#00ccff', opacity: 0.7 },
  attachmentBadge: { fontSize: '0.7rem', color: '#00ff88', background: 'rgba(0,255,136,0.1)', padding: '2px 6px', borderRadius: '8px', fontWeight: 600 },
  workflowDot: { color: '#00ff88', fontSize: '0.6rem' },
  workflowItemWithMedia: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' },
  workflowItemThumb: { width: '50px', height: '50px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  workflowItemThumbMedia: { width: '100%', height: '100%', objectFit: 'cover' },
  workflowItemThumbIcon: { fontSize: '1.5rem' },
  workflowItemName: { flex: 1, fontSize: '0.9rem', color: '#e0e0e0' },
  addWorkflowSection: { display: 'flex', flexDirection: 'column', gap: '10px' },
  workflowUrlInput: { padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,204,255,0.2)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', fontFamily: '"Rajdhani", sans-serif' },
  mediaPreviewHint: { fontSize: '0.8rem', color: '#00ff88', padding: '8px 12px', background: 'rgba(0,255,136,0.1)', borderRadius: '6px' },
  mediaViewerModal: { background: 'linear-gradient(145deg, #1a1a2e 0%, #0f0f1a 100%)', border: '2px solid #00ff88', borderRadius: '16px', padding: '20px', maxWidth: '900px', width: '95%', maxHeight: '90vh', overflow: 'auto', position: 'relative', boxShadow: '0 0 60px rgba(0,255,136,0.3)' },
  mediaViewerTitle: { fontFamily: '"Orbitron", sans-serif', fontSize: '1.2rem', color: '#00ff88', margin: '15px 0 0 0', textAlign: 'center' },
  mediaViewerContent: { display: 'flex', justifyContent: 'center', alignItems: 'center' },
  mediaViewerImage: { maxWidth: '100%', maxHeight: '70vh', borderRadius: '8px' },
  mediaViewerVideo: { maxWidth: '100%', maxHeight: '70vh', borderRadius: '8px' },
  mediaViewerIframe: { width: '100%', height: '500px', borderRadius: '8px', border: 'none' },
  mediaViewerLink: { textAlign: 'center', padding: '40px' },
  mediaViewerLinkBtn: { display: 'inline-block', padding: '15px 30px', background: 'linear-gradient(90deg, #00ff88, #00ccff)', color: '#0a0a0f', textDecoration: 'none', borderRadius: '8px', fontFamily: '"Orbitron", sans-serif', fontWeight: 700, fontSize: '1.1rem' },
  mediaViewerLinkHint: { marginTop: '15px', color: '#888', fontSize: '0.85rem' },
  modalMilestones: { display: 'flex', flexDirection: 'column', gap: '8px' },
  modalMilestone: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' },
  milestoneXPSmall: { marginLeft: 'auto', color: '#00ff88', fontSize: '0.75rem', fontFamily: '"Share Tech Mono", monospace' },
  editFromViewBtn: { width: '100%', padding: '12px', marginTop: '20px', background: 'linear-gradient(90deg, rgba(0,255,136,0.2), rgba(0,204,255,0.2))', border: '1px solid #00ff88', borderRadius: '8px', color: '#00ff88', cursor: 'pointer', fontFamily: '"Orbitron", sans-serif', fontSize: '0.9rem', fontWeight: 600 },
  editSection: { marginBottom: '25px' },
  editSectionTitle: { fontFamily: '"Orbitron", sans-serif', fontSize: '0.85rem', fontWeight: 600, color: '#00ccff', margin: '0 0 12px 0' },
  milestoneToggles: { display: 'flex', flexDirection: 'column', gap: '8px' },
  milestoneToggle: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease' },
  milestoneToggleActive: { background: 'rgba(0,255,136,0.1)', borderColor: 'rgba(0,255,136,0.4)' },
  toggleIcon: { fontSize: '1.2rem' },
  toggleInfo: { display: 'flex', flexDirection: 'column' },
  toggleTitle: { color: '#fff', fontWeight: 600, fontSize: '0.9rem' },
  toggleDate: { color: '#888', fontSize: '0.75rem' },
  xpPreview: { marginTop: '12px', padding: '10px', background: 'rgba(0,255,136,0.05)', borderRadius: '6px', textAlign: 'center', fontSize: '0.85rem', color: '#888' },
  xpPreviewValue: { color: '#00ff88', fontFamily: '"Orbitron", sans-serif', fontWeight: 700, fontSize: '1.1rem' },
  streakControl: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' },
  streakBtn: { width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #ff6b35', background: 'rgba(255,107,53,0.1)', color: '#ff6b35', fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  streakValue: { fontFamily: '"Orbitron", sans-serif', fontSize: '2.5rem', fontWeight: 700, color: '#ff6b35', minWidth: '60px', textAlign: 'center' },
  workflowList: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' },
  workflowItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '0.9rem' },
  removeWorkflowBtn: { background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '1rem', padding: '4px 8px' },
  addWorkflow: { display: 'flex', gap: '10px' },
  workflowInput: { flex: 1, padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem', fontFamily: '"Rajdhani", sans-serif' },
  addWorkflowBtn: { padding: '10px 16px', background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.4)', borderRadius: '6px', color: '#00ff88', cursor: 'pointer', fontFamily: '"Rajdhani", sans-serif', fontWeight: 600 },
  editActions: { display: 'flex', gap: '12px', marginTop: '25px' },
  cancelBtn: { flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#888', cursor: 'pointer', fontFamily: '"Rajdhani", sans-serif', fontSize: '1rem', fontWeight: 600 },
  saveBtn: { flex: 2, padding: '12px', background: 'linear-gradient(90deg, #00ff88, #00ccff)', border: 'none', borderRadius: '8px', color: '#0a0a0f', cursor: 'pointer', fontFamily: '"Orbitron", sans-serif', fontSize: '1rem', fontWeight: 700 },
  footer: { display: 'flex', justifyContent: 'center', gap: '50px', padding: '30px 20px', marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.05)' },
  footerStat: { textAlign: 'center' },
  footerValue: { fontFamily: '"Orbitron", sans-serif', fontSize: '2rem', fontWeight: 700, color: '#00ff88', display: 'block' },
  footerLabel: { fontFamily: '"Share Tech Mono", monospace', fontSize: '0.7rem', color: '#555', letterSpacing: '0.2em' },

  // Slack thread styles
  slackThreadLoading: { textAlign: 'center', padding: '40px', color: '#888' },
  loadingSpinner: { fontSize: '2rem', marginBottom: '10px', animation: 'pulse 1s infinite' },
  slackThreadError: { textAlign: 'center', padding: '40px' },
  errorTitle: { color: '#ff6b6b', fontSize: '1.1rem', marginBottom: '10px' },
  errorMessage: { color: '#888', fontSize: '0.9rem', marginBottom: '20px' },
  slackThreadContainer: { width: '100%', maxWidth: '800px', margin: '0 auto' },
  slackThreadHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  slackThreadBadge: { background: 'rgba(0,204,255,0.15)', color: '#00ccff', padding: '5px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600 },
  slackOpenLink: { color: '#00ccff', fontSize: '0.85rem', textDecoration: 'none', opacity: 0.8, transition: 'opacity 0.2s' },
  slackMessages: { display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '60vh', overflowY: 'auto', padding: '10px' },
  slackMessage: { background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '12px', border: '1px solid rgba(255,255,255,0.05)' },
  slackMessageHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' },
  slackAvatar: { width: '36px', height: '36px', borderRadius: '6px' },
  slackAvatarPlaceholder: { width: '36px', height: '36px', borderRadius: '6px', background: 'rgba(0,204,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00ccff', fontWeight: 700, fontSize: '1.1rem' },
  slackMessageInfo: { display: 'flex', flexDirection: 'column' },
  slackUsername: { fontWeight: 600, color: '#fff', fontSize: '0.95rem' },
  slackTimestamp: { fontSize: '0.75rem', color: '#666' },
  slackMessageText: { color: '#e0e0e0', fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' },

  // Slack attachments styles
  slackAttachmentsSection: { marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' },
  slackAttachmentsTitle: { fontSize: '0.95rem', color: '#00ccff', marginBottom: '15px', fontWeight: 600 },
  slackAttachments: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' },
  slackAttachment: { display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', textDecoration: 'none', transition: 'all 0.2s ease', cursor: 'pointer' },
  slackAttachmentThumb: { width: '100%', height: '120px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' },
  slackAttachmentIcon: { width: '100%', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', background: 'rgba(0,204,255,0.1)', borderRadius: '6px', marginBottom: '8px' },
  slackAttachmentInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  slackAttachmentName: { fontSize: '0.85rem', color: '#fff', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  slackAttachmentMeta: { fontSize: '0.7rem', color: '#666' },
};

export default AgentOpsHackathon;
