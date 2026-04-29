import { useEffect, useState } from 'react';
import { callsAPI, usersAPI } from '../../services/api';
import '../calls/calls-panel.css';

export default function CallsPanel({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCall, setActiveCall] = useState(null);

  useEffect(() => {
    let mounted = true;

    Promise.all([usersAPI.getAll(), callsAPI.getAll(currentUser._id)])
      .then(([allUsers, recentCalls]) => {
        if (!mounted) return;
        setUsers(allUsers.filter((user) => user._id !== currentUser._id));
        setCalls(recentCalls);
      })
      .catch(console.error)
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [currentUser._id]);

  const startCall = async (receiverId, callType) => {
    try {
      const session = await callsAPI.create({ initiatorId: currentUser._id, receiverId, callType });
      setActiveCall(session);
      setCalls((prev) => [session, ...prev]);
    } catch (error) {
      console.error(error);
    }
  };

  const updateCall = async (callId, status) => {
    try {
      const session = await callsAPI.update(callId, status);
      setActiveCall(status === 'ended' || status === 'rejected' ? null : session);
      setCalls((prev) => prev.map((call) => (call._id === session._id ? session : call)));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="cp-root">
      <div className="cp-header">
        <div>
          <p className="cp-kicker">Signal only</p>
          <h2>Calls</h2>
        </div>
        <span className="cp-pill">Simulated</span>
      </div>

      {activeCall ? (
        <div className="cp-active">
          <div className="cp-ring">Calling...</div>
          <p>
            {activeCall.initiatorId?.username} is calling {activeCall.receiverId?.username}
          </p>
          <div className="cp-actions">
            <button type="button" className="cp-button accept" onClick={() => updateCall(activeCall._id, 'accepted')}>
              Accept
            </button>
            <button type="button" className="cp-button reject" onClick={() => updateCall(activeCall._id, 'rejected')}>
              Reject
            </button>
            <button type="button" className="cp-button" onClick={() => updateCall(activeCall._id, 'ended')}>
              End
            </button>
          </div>
        </div>
      ) : (
        <div className="cp-empty">Start a simulated call with any user.</div>
      )}

      <div className="cp-contact-list">
        {loading ? (
          <div className="cp-empty">Loading contacts...</div>
        ) : users.length === 0 ? (
          <div className="cp-empty">No contacts available.</div>
        ) : (
          users.map((user) => (
            <div key={user._id} className="cp-contact-row">
              <div>
                <strong>{user.username}</strong>
                <p>{user.isOnline ? 'online' : 'offline'}</p>
              </div>
              <div className="cp-contact-actions">
                <button type="button" onClick={() => startCall(user._id, 'audio')}>Audio</button>
                <button type="button" onClick={() => startCall(user._id, 'video')}>Video</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="cp-history">
        <h3>Recent sessions</h3>
        {calls.length === 0 ? (
          <p className="cp-empty">No call history yet.</p>
        ) : (
          calls.map((call) => (
            <div key={call._id} className="cp-history-row">
              <span>{call.callType}</span>
              <strong>{call.status}</strong>
              <span>{call.receiverId?.username || 'Unknown'}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
