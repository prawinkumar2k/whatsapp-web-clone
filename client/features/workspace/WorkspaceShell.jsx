import Chat from '../../pages/Chat';
import StatusPanel from '../status/StatusPanel';
import CallsPanel from '../calls/CallsPanel';
import '../workspace/workspace-shell.css';

const TABS = [
  { id: 'chats', label: 'Chats' },
  { id: 'status', label: 'Status' },
  { id: 'calls', label: 'Calls' },
];

export default function WorkspaceShell({ currentUser, activeTab, onTabChange, onLogout }) {
  return (
    <div className="ws-root">
      <div className="ws-tabs">
        <div className="ws-brand">
          <span className="ws-dot" />
          <div>
            <strong>WhatsApp-like Workspace</strong>
            <span>{currentUser.username}</span>
          </div>
        </div>

        <div className="ws-tablist" role="tablist" aria-label="Workspace sections">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`ws-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button type="button" className="ws-logout" onClick={onLogout}>
          Logout
        </button>
      </div>

      <div className="ws-stage">
        {activeTab === 'chats' && <Chat user={currentUser} onLogout={onLogout} />}
        {activeTab === 'status' && <StatusPanel currentUser={currentUser} />}
        {activeTab === 'calls' && <CallsPanel currentUser={currentUser} />}
      </div>
    </div>
  );
}
