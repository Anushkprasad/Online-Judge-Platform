const Discussion = require('../models/Discussion');
const Problem = require('../models/Problem');

const getProblemFilter = async (problem) => {
  if (!problem) return {};
  const candidates = [{ slug: problem }];
  if (problem.match(/^[0-9a-fA-F]{24}$/)) {
    candidates.push({ _id: problem });
  }

  const problemDoc = await Problem.findOne({ $or: candidates }).select('_id');

  if (!problemDoc) return { problemId: null };
  return { problemId: problemDoc._id };
};

exports.getDiscussions = async (req, res, next) => {
  try {
    const { problem, search } = req.query;
    const query = await getProblemFilter(problem);

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const discussions = await Discussion.find(query)
      .populate('userId', 'username profilePicture')
      .populate('problemId', 'title slug difficulty')
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, count: discussions.length, data: discussions });
  } catch (error) {
    next(error);
  }
};

exports.createDiscussion = async (req, res, next) => {
  try {
    const { title, content, problemId, tags } = req.body;
    const discussion = await Discussion.create({
      userId: req.user._id,
      title,
      content,
      problemId: problemId || null,
      tags: tags || [],
    });

    const populated = await discussion.populate([
      { path: 'userId', select: 'username profilePicture' },
      { path: 'problemId', select: 'title slug difficulty' },
    ]);

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

exports.getDiscussionById = async (req, res, next) => {
  try {
    const discussion = await Discussion.findById(req.params.id)
      .populate('userId', 'username profilePicture')
      .populate('problemId', 'title slug difficulty')
      .populate('comments.userId', 'username profilePicture');

    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }

    res.status(200).json({ success: true, data: discussion });
  } catch (error) {
    next(error);
  }
};

exports.toggleDiscussionLike = async (req, res, next) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }

    const index = discussion.likes.findIndex((id) => id.equals(req.user._id));
    const liked = index === -1;
    if (liked) {
      discussion.likes.push(req.user._id);
    } else {
      discussion.likes.splice(index, 1);
    }

    await discussion.save();
    res.status(200).json({ success: true, liked, likesCount: discussion.likes.length });
  } catch (error) {
    next(error);
  }
};

exports.addComment = async (req, res, next) => {
  try {
    const { content, parentId } = req.body;
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }

    if (parentId) {
      const parentExists = discussion.comments.some((comment) => comment._id.equals(parentId));
      if (!parentExists) {
        return res.status(400).json({ success: false, message: 'Parent comment not found' });
      }
    }

    discussion.comments.push({
      userId: req.user._id,
      content,
      parentId: parentId || null,
      likes: [],
    });
    await discussion.save();

    const populated = await Discussion.findById(discussion._id)
      .populate('userId', 'username profilePicture')
      .populate('problemId', 'title slug difficulty')
      .populate('comments.userId', 'username profilePicture');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

exports.toggleCommentLike = async (req, res, next) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }

    const comment = discussion.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const index = comment.likes.findIndex((id) => id.equals(req.user._id));
    const liked = index === -1;
    if (liked) {
      comment.likes.push(req.user._id);
    } else {
      comment.likes.splice(index, 1);
    }

    await discussion.save();
    res.status(200).json({ success: true, liked, likesCount: comment.likes.length });
  } catch (error) {
    next(error);
  }
};
