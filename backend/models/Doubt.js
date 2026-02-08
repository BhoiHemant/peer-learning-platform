const mongoose = require('mongoose');

const DoubtSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a title'],
        trim: true,
        maxlength: [200, 'Title cannot be more than 200 characters']
    },
    details: {
        type: String,
        required: [true, 'Please provide details'],
        maxlength: [2000, 'Details cannot be more than 2000 characters']
    },
    category: {
        type: String,
        required: [true, 'Please select a category'],
        enum: ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'General']
    },
    tags: [{
        type: String,
        trim: true
    }],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    answers: [{
        content: {
            type: String,
            required: true,
            maxlength: [2000, 'Answer cannot be more than 2000 characters']
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        upvotes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        downvotes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    upvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    downvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    views: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['open', 'closed', 'solved'],
        default: 'open'
    },
    isAnswered: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Virtual for answer count
DoubtSchema.virtual('answerCount').get(function() {
    return this.answers.length;
});

// Virtual for vote score
DoubtSchema.virtual('voteScore').get(function() {
    return this.upvotes.length - this.downvotes.length;
});

// Increment view count
DoubtSchema.methods.incrementViews = function() {
    this.views += 1;
    return this.save();
};

// Check if user has voted
DoubtSchema.methods.hasUserVoted = function(userId, voteType) {
    if (voteType === 'upvote') {
        return this.upvotes.some(id => id.toString() === userId.toString());
    } else if (voteType === 'downvote') {
        return this.downvotes.some(id => id.toString() === userId.toString());
    }
    return false;
};

// Toggle vote
DoubtSchema.methods.toggleVote = function(userId, voteType) {
    if (voteType === 'upvote') {
        if (this.hasUserVoted(userId, 'upvote')) {
            this.upvotes = this.upvotes.filter(id => id.toString() !== userId.toString());
        } else {
            this.upvotes.push(userId);
            // Remove from downvotes if exists
            this.downvotes = this.downvotes.filter(id => id.toString() !== userId.toString());
        }
    } else if (voteType === 'downvote') {
        if (this.hasUserVoted(userId, 'downvote')) {
            this.downvotes = this.downvotes.filter(id => id.toString() !== userId.toString());
        } else {
            this.downvotes.push(userId);
            // Remove from upvotes if exists
            this.upvotes = this.upvotes.filter(id => id.toString() !== userId.toString());
        }
    }
    return this.save();
};

// Update answered status
DoubtSchema.methods.updateAnsweredStatus = function() {
    this.isAnswered = this.answers.length > 0;
    if (this.isAnswered && this.status === 'open') {
        this.status = 'solved';
    }
    return this.save();
};

module.exports = mongoose.model('Doubt', DoubtSchema);
