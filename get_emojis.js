const fs = require('fs');
const oldText = fs.readFileSync('old_index.html', 'utf8');

const queries = [
    '<div class="about-card-icon">',
    'The 2 Core Winning Strategies',
    'Beating the Sportsbook',
    'What If the',
    'Signal Tiers',
    'Why can a Moneyline',
    'The 3-Step Daily',
    'Subscription & Membership',
    'Membership Terms',
    'How the Platform Works',
    'Betting Concepts',
    'Send Message',
    'Odds Converter &',
    '4-Way Odds',
    'Payout & Expected',
    'Tip: bet the best',
    '<span style="font-size:16px">',
    'Sportsbook Vig Multiplier',
    'Updated \ ·',
    'Simulated (API offline)'
];

const lines = oldText.split('\n');
queries.forEach(q => {
    lines.forEach(l => {
        if(l.includes(q)) {
            console.log(Buffer.from(l.trim()).toString('utf8'));
        }
    });
});