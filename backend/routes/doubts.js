const express = require('express');
const Doubt = require('../models/Doubt');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all doubts
// @route   GET /api/doubts
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { category, search, page = 1, limit = 10 } = req.query;
        
        // Build query
        let query = {};
        
        if (category) {
            query.category = category;
        }
        
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { details: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        const doubts = await Doubt.find(query)
            .populate('author', 'name avatar')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Doubt.countDocuments(query);

        res.status(200).json({
            success: true,
            count: doubts.length,
            total,
            page: Math.ceil(total / limit),
            data: doubts
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @desc    Get single doubt
// @route   GET /api/doubts/:id
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const doubt = await Doubt.findById(req.params.id)
            .populate('author', 'name avatar reputation')
            .populate('answers.author', 'name avatar reputation')
            .populate('answers.upvotes', 'name')
            .populate('answers.downvotes', 'name')
            .populate('upvotes', 'name')
            .populate('downvotes', 'name');

        if (!doubt) {
            return res.status(404).json({ success: false, message: 'Doubt not found' });
        }

        // Increment view count
        await doubt.incrementViews();

        res.status(200).json({
            success: true,
            data: doubt
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @desc    Create new doubt
// @route   POST /api/doubts
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { title, details, category, tags } = req.body;

        // Parse tags from comma-separated string
        const parsedTags = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

        const doubt = await Doubt.create({
            title,
            details,
            category,
            tags: parsedTags,
            author: req.user.id
        });

        const populatedDoubt = await Doubt.findById(doubt._id)
            .populate('author', 'name avatar');

        res.status(201).json({
            success: true,
            data: populatedDoubt
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @desc    Update doubt
// @route   PUT /api/doubts/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        let doubt = await Doubt.findById(req.params.id);

        if (!doubt) {
            return res.status(404).json({ success: false, message: 'Doubt not found' });
        }

        // Check if user is the author
        if (doubt.author.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this doubt' });
        }

        const { title, details, category, tags, status } = req.body;

        // Parse tags from comma-separated string
        const parsedTags = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : doubt.tags;

        doubt = await Doubt.findByIdAndUpdate(
            req.params.id,
            { title, details, category, tags: parsedTags, status },
            { new: true, runValidators: true }
        ).populate('author', 'name avatar');

        res.status(200).json({
            success: true,
            data: doubt
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @desc    Delete doubt
// @route   DELETE /api/doubts/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const doubt = await Doubt.findById(req.params.id);

        if (!doubt) {
            return res.status(404).json({ success: false, message: 'Doubt not found' });
        }

        // Check if user is the author
        if (doubt.author.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this doubt' });
        }

        await doubt.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @desc    Vote on doubt
// @route   POST /api/doubts/:id/vote
// @access  Private
router.post('/:id/vote', protect, async (req, res) => {
    try {
        const { voteType } = req.body; // 'upvote' or 'downvote'

        if (!['upvote', 'downvote'].includes(voteType)) {
            return res.status(400).json({ success: false, message: 'Invalid vote type' });
        }

        const doubt = await Doubt.findById(req.params.id);

        if (!doubt) {
            return res.status(404).json({ success: false, message: 'Doubt not found' });
        }

        await doubt.toggleVote(req.user.id, voteType);

        const updatedDoubt = await Doubt.findById(req.params.id)
            .populate('author', 'name avatar')
            .populate('upvotes', 'name')
            .populate('downvotes', 'name');

        res.status(200).json({
            success: true,
            data: updatedDoubt
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @desc    Add answer to doubt
// @route   POST /api/doubts/:id/answers
// @access  Private
router.post('/:id/answers', protect, async (req, res) => {
    try {
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ success: false, message: 'Answer content is required' });
        }

        const doubt = await Doubt.findById(req.params.id);

        if (!doubt) {
            return res.status(404).json({ success: false, message: 'Doubt not found' });
        }

        const answer = {
            content,
            author: req.user.id
        };

        doubt.answers.push(answer);
        await doubt.save();
        await doubt.updateAnsweredStatus();

        const updatedDoubt = await Doubt.findById(req.params.id)
            .populate('author', 'name avatar reputation')
            .populate('answers.author', 'name avatar reputation');

        res.status(201).json({
            success: true,
            data: updatedDoubt
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @desc    Vote on answer
// @route   POST /api/doubts/:id/answers/:answerId/vote
// @access  Private
router.post('/:id/answers/:answerId/vote', protect, async (req, res) => {
    try {
        const { voteType } = req.body; // 'upvote' or 'downvote'

        if (!['upvote', 'downvote'].includes(voteType)) {
            return res.status(400).json({ success: false, message: 'Invalid vote type' });
        }

        const doubt = await Doubt.findById(req.params.id);

        if (!doubt) {
            return res.status(404).json({ success: false, message: 'Doubt not found' });
        }

        const answer = doubt.answers.id(req.params.answerId);

        if (!answer) {
            return res.status(404).json({ success: false, message: 'Answer not found' });
        }

        // Toggle vote
        if (voteType === 'upvote') {
            if (answer.upvotes.includes(req.user.id)) {
                answer.upvotes = answer.upvotes.filter(id => id.toString() !== req.user.id.toString());
            } else {
                answer.upvotes.push(req.user.id);
                // Remove from downvotes if exists
                answer.downvotes = answer.downvotes.filter(id => id.toString() !== req.user.id.toString());
            }
        } else if (voteType === 'downvote') {
            if (answer.downvotes.includes(req.user.id)) {
                answer.downvotes = answer.downvotes.filter(id => id.toString() !== req.user.id.toString());
            } else {
                answer.downvotes.push(req.user.id);
                // Remove from upvotes if exists
                answer.upvotes = answer.upvotes.filter(id => id.toString() !== req.user.id.toString());
            }
        }

        await doubt.save();

        const updatedDoubt = await Doubt.findById(req.params.id)
            .populate('author', 'name avatar reputation')
            .populate('answers.author', 'name avatar reputation');

        res.status(200).json({
            success: true,
            data: updatedDoubt
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
