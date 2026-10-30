import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Heart, MessageSquare, Plus, Reply, Search, Send } from 'lucide-react';

const buildCommentTree = (comments = []) => {
  const map = new Map();
  const roots = [];

  comments.forEach((comment) => {
    map.set(comment._id, { ...comment, replies: [] });
  });

  map.forEach((comment) => {
    if (comment.parentId && map.has(String(comment.parentId))) {
      map.get(String(comment.parentId)).replies.push(comment);
    } else {
      roots.push(comment);
    }
  });

  return roots;
};

const CommentItem = ({ comment, onReply, onLike }) => (
  <div className="space-y-3">
    <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-200">{comment.userId?.username || 'Coder'}</div>
        <div className="text-xs text-slate-500">{new Date(comment.createdAt).toLocaleString()}</div>
      </div>
      <p className="mt-2 text-sm text-slate-300 whitespace-pre-wrap">{comment.content}</p>
      <div className="mt-3 flex gap-2">
        <button onClick={() => onLike(comment._id)} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-rose-400">
          <Heart className="w-3.5 h-3.5" />
          {comment.likes?.length || 0}
        </button>
        <button onClick={() => onReply(comment._id)} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-blue-400">
          <Reply className="w-3.5 h-3.5" />
          Reply
        </button>
      </div>
    </div>
    {comment.replies?.length > 0 && (
      <div className="ml-5 border-l border-slate-800 pl-4 space-y-3">
        {comment.replies.map((reply) => (
          <CommentItem key={reply._id} comment={reply} onReply={onReply} onLike={onLike} />
        ))}
      </div>
    )}
  </div>
);

const DiscussionPage = () => {
  const [threads, setThreads] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [threadForm, setThreadForm] = useState({ title: '', content: '', tags: '' });
  const [comment, setComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(true);

  const commentTree = useMemo(() => buildCommentTree(selected?.comments || []), [selected]);

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/discussions', { params: search ? { search } : {} });
      setThreads(response.data.data);
      setSelected((current) => current || response.data.data[0] || null);
    } catch (error) {
      console.error('Failed to load discussions:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const refreshSelected = async (id = selected?._id) => {
    if (!id) return;
    const response = await axios.get(`/discussions/${id}`);
    setSelected(response.data.data);
  };

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const createThread = async (event) => {
    event.preventDefault();
    const response = await axios.post('/discussions', {
      ...threadForm,
      tags: threadForm.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    });
    setThreadForm({ title: '', content: '', tags: '' });
    setFormOpen(false);
    setThreads((prev) => [response.data.data, ...prev]);
    setSelected(response.data.data);
  };

  const likeThread = async (id) => {
    await axios.post(`/discussions/${id}/like`);
    await fetchThreads();
    await refreshSelected(id);
  };

  const addComment = async (event) => {
    event.preventDefault();
    if (!selected || !comment.trim()) return;
    const response = await axios.post(`/discussions/${selected._id}/comments`, {
      content: comment,
      parentId: replyTo,
    });
    setSelected(response.data.data);
    setComment('');
    setReplyTo(null);
  };

  const likeComment = async (commentId) => {
    await axios.post(`/discussions/${selected._id}/comments/${commentId}/like`);
    await refreshSelected();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Discussions</h1>
          <p className="text-slate-400">Ask questions, share approaches, and reply in threaded problem discussions.</p>
        </div>
        <button onClick={() => setFormOpen((value) => !value)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          New Thread
        </button>
      </div>

      {formOpen && (
        <form onSubmit={createThread} className="grid gap-3 rounded-lg border border-slate-800 bg-slate-900 p-4">
          <input value={threadForm.title} onChange={(e) => setThreadForm((prev) => ({ ...prev, title: e.target.value }))} required placeholder="Thread title" className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-600" />
          <textarea value={threadForm.content} onChange={(e) => setThreadForm((prev) => ({ ...prev, content: e.target.value }))} required placeholder="What do you want to discuss?" className="min-h-24 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-600" />
          <input value={threadForm.tags} onChange={(e) => setThreadForm((prev) => ({ ...prev, tags: e.target.value }))} placeholder="Tags, comma separated" className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-600" />
          <button className="justify-self-end rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">Post Thread</button>
        </form>
      )}

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.25fr]">
        <section className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
          <form onSubmit={(e) => { e.preventDefault(); fetchThreads(); }} className="relative border-b border-slate-800 p-4">
            <Search className="absolute left-7 top-6 w-4 h-4 text-slate-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search threads..." className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-10 pr-3 text-sm text-white outline-none focus:border-blue-600" />
          </form>
          <div className="divide-y divide-slate-800">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading threads...</div>
            ) : threads.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No discussions yet.</div>
            ) : threads.map((thread) => (
              <button key={thread._id} onClick={() => refreshSelected(thread._id)} className={`w-full p-4 text-left transition-colors ${selected?._id === thread._id ? 'bg-slate-800/60' : 'hover:bg-slate-800/30'}`}>
                <div className="font-semibold text-slate-100">{thread.title}</div>
                <div className="mt-1 text-xs text-slate-500">{thread.problemId?.title || 'General'} · {thread.comments?.length || 0} comments</div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
          {selected ? (
            <div className="p-5 space-y-5">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">{selected.title}</h2>
                    <p className="mt-1 text-xs text-slate-500">Posted by {selected.userId?.username || 'Coder'}</p>
                  </div>
                  <button onClick={() => likeThread(selected._id)} className="inline-flex items-center gap-1 rounded-lg border border-slate-800 px-3 py-1.5 text-sm font-semibold text-slate-300 hover:text-rose-400">
                    <Heart className="w-4 h-4" />
                    {selected.likes?.length || 0}
                  </button>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">{selected.content}</p>
              </div>

              <form onSubmit={addComment} className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-3">
                {replyTo && <div className="text-xs text-blue-400">Replying to comment <button type="button" onClick={() => setReplyTo(null)} className="text-slate-400 hover:text-white">cancel</button></div>}
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment..." className="min-h-20 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-600" />
                <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
                  <Send className="w-4 h-4" />
                  Comment
                </button>
              </form>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  Replies
                </div>
                {commentTree.length === 0 ? (
                  <div className="text-sm text-slate-500">No replies yet.</div>
                ) : commentTree.map((item) => (
                  <CommentItem key={item._id} comment={item} onReply={setReplyTo} onLike={likeComment} />
                ))}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">Select a thread to read the discussion.</div>
          )}
        </section>
      </div>
    </div>
  );
};

export default DiscussionPage;
