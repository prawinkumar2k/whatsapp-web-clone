import { useEffect, useMemo, useState } from 'react';
import { statusesAPI } from '../../services/api';
import '../status/status-panel.css';

function Avatar({ name }) {
  return <div className="sp-avatar">{(name?.[0] ?? '?').toUpperCase()}</div>;
}

function formatExpiry(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function StatusPanel({ currentUser }) {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [viewer, setViewer] = useState(null);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let mounted = true;

    statusesAPI
      .getActive()
      .then((items) => {
        if (mounted) setStatuses(items);
      })
      .catch(console.error)
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const grouped = useMemo(() => {
    return statuses.reduce((acc, status) => {
      const key = status.userId?._id || status.userId;
      if (!acc[key]) {
        acc[key] = {
          user: status.userId,
          items: [],
        };
      }
      acc[key].items.push(status);
      return acc;
    }, {});
  }, [statuses]);

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (readerEvent) => setMediaUrl(readerEvent.target.result);
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handlePost = async (event) => {
    event.preventDefault();
    if (!mediaUrl) return;

    try {
      setPosting(true);
      const created = await statusesAPI.create(currentUser._id, mediaUrl, caption.trim());
      setStatuses((prev) => [created, ...prev]);
      setMediaUrl('');
      setCaption('');
    } catch (error) {
      console.error(error);
    } finally {
      setPosting(false);
    }
  };

  const openViewer = async (status) => {
    setViewer(status);
    try {
      const updated = await statusesAPI.view(status._id, currentUser._id);
      setStatuses((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="sp-root">
      <div className="sp-rail">
        <div className="sp-header">
          <div>
            <p className="sp-kicker">Stories</p>
            <h2>Status</h2>
          </div>
          <span className="sp-pill">{statuses.length} active</span>
        </div>

        <form className="sp-composer" onSubmit={handlePost}>
          <label className="sp-upload">
            <input type="file" accept="image/*" onChange={handleFile} />
            <span>Choose image</span>
          </label>
          <input
            className="sp-caption"
            type="text"
            placeholder="Add a caption"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
          />
          <button className="sp-button" disabled={!mediaUrl || posting} type="submit">
            {posting ? 'Posting...' : 'Post status'}
          </button>
        </form>

        {mediaUrl && <img className="sp-preview" src={mediaUrl} alt="status preview" />}

        <div className="sp-list">
          {loading ? (
            <div className="sp-empty">Loading stories...</div>
          ) : statuses.length === 0 ? (
            <div className="sp-empty">No active statuses yet. Share one to start the story rail.</div>
          ) : (
            Object.values(grouped).map((entry) => (
              <button key={entry.user?._id} className="sp-story-card" onClick={() => openViewer(entry.items[0])}>
                <Avatar name={entry.user?.username} />
                <div className="sp-story-copy">
                  <strong>{entry.user?.username}</strong>
                  <span>{entry.items.length} update{entry.items.length > 1 ? 's' : ''}</span>
                </div>
                <span className="sp-story-time">{formatExpiry(entry.items[0].expiresAt)}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {viewer && (
        <div className="sp-viewer" onClick={() => setViewer(null)}>
          <div className="sp-viewer-card" onClick={(event) => event.stopPropagation()}>
            <img src={viewer.mediaUrl} alt={viewer.caption || 'status'} />
            <div className="sp-viewer-meta">
              <strong>{viewer.userId?.username}</strong>
              <p>{viewer.caption || 'No caption'}</p>
            </div>
            <button className="sp-close" onClick={() => setViewer(null)} type="button">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
