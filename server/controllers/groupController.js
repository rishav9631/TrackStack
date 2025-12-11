const Group = require('../models/Group');
const User = require('../models/User');
const crypto = require('crypto');

// Generate a random 6-character code
const generateGroupCode = () => {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
};

exports.createGroup = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Group name is required' });

        let code = generateGroupCode();
        // Ensure uniqueness (simple check)
        let existing = await Group.findOne({ code });
        while (existing) {
            code = generateGroupCode();
            existing = await Group.findOne({ code });
        }

        const group = await Group.create({
            name,
            code,
            members: [req.user.id],
            createdBy: req.user.id
        });

        res.status(201).json({ success: true, group });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to create group' });
    }
};

exports.joinGroup = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ success: false, message: 'Group code is required' });

        const group = await Group.findOne({ code });
        if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

        if (group.members.includes(req.user.id)) {
            return res.status(400).json({ success: false, message: 'You are already a member of this group' });
        }

        group.members.push(req.user.id);
        await group.save();

        res.status(200).json({ success: true, message: 'Joined group successfully', group });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to join group' });
    }
};

exports.getUserGroups = async (req, res) => {
    try {
        const groups = await Group.find({ members: req.user.id })
            .populate('members', 'name email')
            .populate('createdBy', 'name');
        res.status(200).json({ success: true, groups });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch groups' });
    }
};

exports.getGroupDetails = async (req, res) => {
    try {
        const { groupId } = req.params;
        const group = await Group.findById(groupId)
            .populate('members', 'name email')
            .populate('expenses.payer', 'name');

        if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

        // Check if user is member
        if (!group.members.some(member => member._id.toString() === req.user.id)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.status(200).json({ success: true, group });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch group details' });
    }
};
