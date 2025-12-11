const Investment = require('../models/Investment');

exports.addInvestment = async (req, res) => {
    try {
        const { symbol, name, category, quantity, investedAmount } = req.body;

        // Check if investment already exists for this user and symbol
        let investment = await Investment.findOne({ user: req.user.id, symbol });

        if (investment) {
            // Update existing investment
            investment.quantity = quantity;
            investment.investedAmount = investedAmount;
            investment.name = name; // Update name just in case
            await investment.save();
        } else {
            // Create new investment
            investment = new Investment({
                user: req.user.id,
                symbol,
                name,
                category,
                quantity,
                investedAmount
            });
            await investment.save();
        }

        res.status(200).json({
            success: true,
            data: investment
        });
    } catch (error) {
        console.error('Error adding investment:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

exports.getInvestments = async (req, res) => {
    try {
        const investments = await Investment.find({ user: req.user.id });

        res.status(200).json({
            success: true,
            data: investments
        });
    } catch (error) {
        console.error('Error fetching investments:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

exports.deleteInvestment = async (req, res) => {
    try {
        const investment = await Investment.findOne({ _id: req.params.id, user: req.user.id });

        if (!investment) {
            return res.status(404).json({
                success: false,
                message: 'Investment not found'
            });
        }

        await investment.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Error deleting investment:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
