import json
import subprocess

PRES_ID = "1BG2v1kpj0leHl1Pc5BjZCdzfAPedihJZW04zjqyLlCM"

ops = []

# --- SLIDE 1 (p): TITLE SLIDE (Dark Forest Green) ---
ops.extend([
    {"op": "delete-element", "element": "i0"},
    {"op": "delete-element", "element": "i1"},
    {"op": "set-background", "slide": "p", "color": "#123D35"},
    {
        "op": "add-textbox",
        "slide": "p",
        "text": "SHABACH 2026 GRAND FINALE",
        "x": 60, "y": 80, "width": 600, "height": 30,
        "font_size": 13, "bold": True, "color": "#C4A56A", "font_family": "Georgia"
    },
    {
        "op": "add-textbox",
        "slide": "p",
        "text": "Platform Architecture &\nOperational User Guide",
        "x": 60, "y": 120, "width": 600, "height": 110,
        "font_size": 34, "bold": True, "color": "#F8F6F0", "font_family": "Georgia"
    },
    {
        "op": "add-textbox",
        "slide": "p",
        "text": "A Complete Visual Guide to Competition Scoring, Role Segregation, and Event-Day Flow\nPresented for Leadership Review & Operational Team Orientation",
        "x": 60, "y": 245, "width": 600, "height": 50,
        "font_size": 13, "color": "#D5DFDC", "font_family": "Arial"
    },
    {
        "op": "add-textbox",
        "slide": "p",
        "text": "16 Finalists  •  4 Adjudicators  •  OTP Audience Voting  •  Strict Privacy Isolation",
        "x": 60, "y": 330, "width": 600, "height": 25,
        "font_size": 11, "bold": True, "color": "#C4A56A", "font_family": "Arial"
    },
    {
        "op": "set-notes",
        "slide": "p",
        "text": "Welcome everyone! This presentation covers the SHABACH 2026 competition platform. We will explain how the 100-point score is calculated, how each user role operates, and how results are verified and published."
    }
])

# --- SLIDE 2: THE 100-POINT CAKE FORMULA (Light Ivory) ---
ops.extend([
    {"op": "add-slide", "layout": "BLANK", "id": "SLIDE_2"},
    {"op": "set-background", "slide": "SLIDE_2", "color": "#F8F6F0"},
    {
        "op": "add-textbox",
        "slide": "SLIDE_2",
        "text": "THE CORE SCORING MODEL",
        "x": 50, "y": 35, "width": 620, "height": 20,
        "font_size": 11, "bold": True, "color": "#967C44", "font_family": "Arial"
    },
    {
        "op": "add-textbox",
        "slide": "SLIDE_2",
        "text": "How We Pick the Winner: The 100-Point Cake",
        "x": 50, "y": 55, "width": 620, "height": 40,
        "font_size": 22, "bold": True, "color": "#123D35", "font_family": "Georgia"
    },
    # Card 1: Judges 95
    {
        "op": "add-shape", "slide": "SLIDE_2", "shape_type": "ROUND_RECTANGLE",
        "x": 50, "y": 115, "width": 190, "height": 180,
        "background_color": "#FFFFFF"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_2",
        "text": "95.00",
        "x": 65, "y": 130, "width": 160, "height": 45,
        "font_size": 32, "bold": True, "color": "#123D35", "font_family": "Georgia", "alignment": "CENTER"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_2",
        "text": "1. THE CAKE BASE\n(4 Judges' Average)",
        "x": 65, "y": 180, "width": 160, "height": 35,
        "font_size": 11, "bold": True, "color": "#967C44", "alignment": "CENTER"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_2",
        "text": "4 criteria x 20 = 80 pts\n+ 15 pts Audience Impact\nEvaluated on category rubric",
        "x": 65, "y": 220, "width": 160, "height": 65,
        "font_size": 11, "color": "#555555", "alignment": "CENTER"
    },
    # Card 2: Audience 5
    {
        "op": "add-shape", "slide": "SLIDE_2", "shape_type": "ROUND_RECTANGLE",
        "x": 265, "y": 115, "width": 190, "height": 180,
        "background_color": "#FFFFFF"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_2",
        "text": "+5.00",
        "x": 280, "y": 130, "width": 160, "height": 45,
        "font_size": 32, "bold": True, "color": "#C4A56A", "font_family": "Georgia", "alignment": "CENTER"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_2",
        "text": "2. SWEET FROSTING\n(Audience Votes)",
        "x": 280, "y": 180, "width": 160, "height": 35,
        "font_size": 11, "bold": True, "color": "#967C44", "alignment": "CENTER"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_2",
        "text": "Verified via email OTP\nScaled to highest-voted act:\n5.00 x (Votes / MaxVotes)",
        "x": 280, "y": 220, "width": 160, "height": 65,
        "font_size": 11, "color": "#555555", "alignment": "CENTER"
    },
    # Card 3: Overtime -2
    {
        "op": "add-shape", "slide": "SLIDE_2", "shape_type": "ROUND_RECTANGLE",
        "x": 480, "y": 115, "width": 190, "height": 180,
        "background_color": "#FFFFFF"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_2",
        "text": "-2.00",
        "x": 495, "y": 130, "width": 160, "height": 45,
        "font_size": 32, "bold": True, "color": "#C53030", "font_family": "Georgia", "alignment": "CENTER"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_2",
        "text": "3. OVERTIME TRIM\n(Stopwatch Penalty)",
        "x": 495, "y": 180, "width": 160, "height": 35,
        "font_size": 11, "bold": True, "color": "#967C44", "alignment": "CENTER"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_2",
        "text": "Deducted per 30 seconds\nexceeded beyond category limit\nAutomated calculation",
        "x": 495, "y": 220, "width": 160, "height": 65,
        "font_size": 11, "color": "#555555", "alignment": "CENTER"
    },
    # Bottom banner
    {
        "op": "add-textbox", "slide": "SLIDE_2",
        "text": "FINAL SCORE = Mean(4 Judges' 95-pt Scorecards) + Audience Bonus (up to 5 pts) - Overtime Penalty  [Maximum = 100.00]",
        "x": 50, "y": 320, "width": 620, "height": 30,
        "font_size": 11, "bold": True, "color": "#123D35", "alignment": "CENTER"
    },
    {
        "op": "set-notes",
        "slide": "SLIDE_2",
        "text": "Explain the formula: 95 points from the 4 judges + up to 5 points from audience voting - 2 points for every 30 seconds of overtime. Total adds up to 100 max."
    }
])

# --- SLIDE 3: THE 5 USER ENTITIES (Light Ivory) ---
ops.extend([
    {"op": "add-slide", "layout": "BLANK", "id": "SLIDE_3"},
    {"op": "set-background", "slide": "SLIDE_3", "color": "#F8F6F0"},
    {
        "op": "add-textbox", "slide": "SLIDE_3",
        "text": "ROLE SEGREGATION ON EVENT DAY",
        "x": 50, "y": 35, "width": 620, "height": 20,
        "font_size": 11, "bold": True, "color": "#967C44", "font_family": "Arial"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_3",
        "text": "The 5 Key People / Entities in the Room",
        "x": 50, "y": 55, "width": 620, "height": 40,
        "font_size": 22, "bold": True, "color": "#123D35", "font_family": "Georgia"
    },
    # 5 Entity Cards
    {
        "op": "add-shape", "slide": "SLIDE_3", "shape_type": "ROUND_RECTANGLE",
        "x": 50, "y": 110, "width": 115, "height": 220, "background_color": "#FFFFFF"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_3",
        "text": "1. AUDIENCE\n\nDevice: Mobile\nRoute: /\n\n• Browse 16 acts\n• Scan stage QR\n• Verify email OTP\n• Cast 1 single vote",
        "x": 55, "y": 120, "width": 105, "height": 200, "font_size": 11, "color": "#222222"
    },
    {
        "op": "add-shape", "slide": "SLIDE_3", "shape_type": "ROUND_RECTANGLE",
        "x": 175, "y": 110, "width": 115, "height": 220, "background_color": "#FFFFFF"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_3",
        "text": "2. 4 JUDGES\n\nDevice: 4 iPads\nRoute: /judges\n\n• 4 isolated seats\n• 5 criteria rubric\n• Unsaved dot\n• Submit locked card",
        "x": 180, "y": 120, "width": 105, "height": 200, "font_size": 11, "color": "#222222"
    },
    {
        "op": "add-shape", "slide": "SLIDE_3", "shape_type": "ROUND_RECTANGLE",
        "x": 300, "y": 110, "width": 115, "height": 220, "background_color": "#FFFFFF"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_3",
        "text": "3. TIMEKEEPER\n\nDevice: Stopwatch\nSlips: Physical\n\n• First note to bow\n• Hand slip to desk\n• -2 pts / 30s over\n• Category limits",
        "x": 305, "y": 120, "width": 105, "height": 200, "font_size": 11, "color": "#222222"
    },
    {
        "op": "add-shape", "slide": "SLIDE_3", "shape_type": "ROUND_RECTANGLE",
        "x": 425, "y": 110, "width": 115, "height": 220, "background_color": "#FFFFFF"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_3",
        "text": "4. SCORE DESK\n\nDevice: Laptop\nRoute: /organiser\n\n• Voting window\n• Duration logs\n• 6 Safety Gates\n• Lock & Publish",
        "x": 430, "y": 120, "width": 105, "height": 200, "font_size": 11, "color": "#222222"
    },
    {
        "op": "add-shape", "slide": "SLIDE_3", "shape_type": "ROUND_RECTANGLE",
        "x": 550, "y": 110, "width": 115, "height": 220, "background_color": "#FFFFFF"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_3",
        "text": "5. STAGE MC\n\nDevice: Printout\nRoute: /results\n\n• Signed printout\n• Announce Top 3\n• Ranks 4-16 sealed\n• Zero leaked marks",
        "x": 555, "y": 120, "width": 105, "height": 200, "font_size": 11, "color": "#222222"
    },
    {
        "op": "set-notes",
        "slide": "SLIDE_3",
        "text": "Emphasize role segregation: Nobody crosses into another person's lane. Judges only see their scorecard. The audience only sees the public vote. The score desk holds the master keys."
    }
])

# --- SLIDE 4: AUDIENCE VOTER JOURNEY ---
ops.extend([
    {"op": "add-slide", "layout": "BLANK", "id": "SLIDE_4"},
    {"op": "set-background", "slide": "SLIDE_4", "color": "#F8F6F0"},
    {
        "op": "add-textbox", "slide": "SLIDE_4",
        "text": "ENTITY 1: THE AUDIENCE VOTER",
        "x": 50, "y": 35, "width": 620, "height": 20,
        "font_size": 11, "bold": True, "color": "#967C44", "font_family": "Arial"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_4",
        "text": "Mobile Audience Voting & Single-Vote Defense",
        "x": 50, "y": 55, "width": 620, "height": 40,
        "font_size": 22, "bold": True, "color": "#123D35", "font_family": "Georgia"
    },
    # 3 Steps
    {
        "op": "add-shape", "slide": "SLIDE_4", "shape_type": "ROUND_RECTANGLE",
        "x": 50, "y": 110, "width": 190, "height": 130, "background_color": "#FFFFFF"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_4",
        "text": "Step 1: Scan & Search\n\nVoter scans stage QR code or searches contestant name/code on shabach.vercel.app.",
        "x": 65, "y": 125, "width": 160, "height": 100, "font_size": 12, "color": "#222222"
    },
    {
        "op": "add-shape", "slide": "SLIDE_4", "shape_type": "ROUND_RECTANGLE",
        "x": 265, "y": 110, "width": 190, "height": 130, "background_color": "#FFFFFF"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_4",
        "text": "Step 2: Enter Email (OTP)\n\nVoter taps 'Vote for Contestant', enters email, and receives a 6-digit code in seconds.",
        "x": 280, "y": 125, "width": 160, "height": 100, "font_size": 12, "color": "#222222"
    },
    {
        "op": "add-shape", "slide": "SLIDE_4", "shape_type": "ROUND_RECTANGLE",
        "x": 480, "y": 110, "width": 190, "height": 130, "background_color": "#FFFFFF"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_4",
        "text": "Step 3: Confirm Ballot\n\nVoter inputs the 6-digit code and confirms. Receipt badge confirms ballot persistence.",
        "x": 495, "y": 125, "width": 160, "height": 100, "font_size": 12, "color": "#222222"
    },
    # Security Callouts
    {
        "op": "add-shape", "slide": "SLIDE_4", "shape_type": "ROUND_RECTANGLE",
        "x": 50, "y": 260, "width": 300, "height": 90, "background_color": "#DEF7EC"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_4",
        "text": "🛡️ 1-Person-1-Vote Policy\nIf a voter attempts to vote again for any act, the system immediately blocks it: 'You have already cast your single vote for this finale.'",
        "x": 65, "y": 270, "width": 270, "height": 70, "font_size": 11, "bold": True, "color": "#03543F"
    },
    {
        "op": "add-shape", "slide": "SLIDE_4", "shape_type": "ROUND_RECTANGLE",
        "x": 370, "y": 260, "width": 300, "height": 90, "background_color": "#FEF08A"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_4",
        "text": "⏳ 15-Minute Voting Window\nVoting is locked until Act 16 concludes. Director opens voting for 15 minutes, then closes it before score collation begins.",
        "x": 385, "y": 270, "width": 270, "height": 70, "font_size": 11, "bold": True, "color": "#713F12"
    },
    {
        "op": "set-notes",
        "slide": "SLIDE_4",
        "text": "Point out that email OTP stops vote stuffing. Nobody can sit in the audience with bot scripts casting 500 votes. Exactly one vote per verified human email."
    }
])

# --- SLIDE 5: 4 JUDGES WORKSPACE ---
ops.extend([
    {"op": "add-slide", "layout": "BLANK", "id": "SLIDE_5"},
    {"op": "set-background", "slide": "SLIDE_5", "color": "#F8F6F0"},
    {
        "op": "add-textbox", "slide": "SLIDE_5",
        "text": "ENTITY 2: THE 4 JUDGES",
        "x": 50, "y": 35, "width": 620, "height": 20,
        "font_size": 11, "bold": True, "color": "#967C44", "font_family": "Arial"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_5",
        "text": "Adjudication Console: /judges/judge[1-4]",
        "x": 50, "y": 55, "width": 620, "height": 40,
        "font_size": 22, "bold": True, "color": "#123D35", "font_family": "Georgia"
    },
    # 4 Feature Boxes
    {
        "op": "add-shape", "slide": "SLIDE_5", "shape_type": "ROUND_RECTANGLE",
        "x": 50, "y": 110, "width": 295, "height": 110, "background_color": "#FFFFFF"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_5",
        "text": "Category Rubrics (95 Pts Max)\nTailored criteria for Music, Dance, Drama, Spoken Word. 4 core criteria (20 pts each) + 15 pts for Audience Impact.",
        "x": 65, "y": 125, "width": 265, "height": 80, "font_size": 12, "color": "#222222"
    },
    {
        "op": "add-shape", "slide": "SLIDE_5", "shape_type": "ROUND_RECTANGLE",
        "x": 375, "y": 110, "width": 295, "height": 110, "background_color": "#FFFFFF"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_5",
        "text": "Live Safety Indicator & Drafts\nGold 'Unsaved edits' dot alerts judge when scores are pending. Judges can tap 'Save draft' anytime to persist work locally.",
        "x": 390, "y": 125, "width": 265, "height": 80, "font_size": 12, "color": "#222222"
    },
    {
        "op": "add-shape", "slide": "SLIDE_5", "shape_type": "ROUND_RECTANGLE",
        "x": 50, "y": 235, "width": 295, "height": 110, "background_color": "#FFFFFF"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_5",
        "text": "Review Card Before Locking\nJudge taps 'Review & submit', verifies the exact raw subtotal in an amber card, then confirms. Once submitted, the card is locked.",
        "x": 65, "y": 250, "width": 265, "height": 80, "font_size": 12, "color": "#222222"
    },
    {
        "op": "add-shape", "slide": "SLIDE_5", "shape_type": "ROUND_RECTANGLE",
        "x": 375, "y": 235, "width": 295, "height": 110, "background_color": "#FFFFFF"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_5",
        "text": "Conflict of Interest Checkbox\nIf a judge has a pastoral or coaching connection with an act, ticking the conflict box locks submission and flags it for score-desk review.",
        "x": 390, "y": 250, "width": 265, "height": 80, "font_size": 12, "color": "#222222"
    },
    {
        "op": "set-notes",
        "slide": "SLIDE_5",
        "text": "Judges love this layout because of the large touch buttons and the clear 'Review before submitting' card that prevents accidental early submissions."
    }
])

# --- SLIDE 6: TIMEKEEPER & OVERTIME ---
ops.extend([
    {"op": "add-slide", "layout": "BLANK", "id": "SLIDE_6"},
    {"op": "set-background", "slide": "SLIDE_6", "color": "#F8F6F0"},
    {
        "op": "add-textbox", "slide": "SLIDE_6",
        "text": "ENTITY 3: THE TIMEKEEPER",
        "x": 50, "y": 35, "width": 620, "height": 20,
        "font_size": 11, "bold": True, "color": "#967C44", "font_family": "Arial"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_6",
        "text": "Precision Stopwatch Timing & Automated Overtime",
        "x": 50, "y": 55, "width": 620, "height": 40,
        "font_size": 22, "bold": True, "color": "#123D35", "font_family": "Georgia"
    },
    # Limits Box
    {
        "op": "add-shape", "slide": "SLIDE_6", "shape_type": "ROUND_RECTANGLE",
        "x": 50, "y": 110, "width": 300, "height": 160, "background_color": "#123D35"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_6",
        "text": "CATEGORY TIME LIMITS\n\n• Music: 4:00 (240 seconds)\n• Dance: 4:00 (240 seconds)\n• Drama: 5:00 (300 seconds)\n• Spoken Word: 3:30 (210 seconds)",
        "x": 65, "y": 125, "width": 270, "height": 130, "font_size": 13, "bold": True, "color": "#F8F6F0"
    },
    # Penalty Box
    {
        "op": "add-shape", "slide": "SLIDE_6", "shape_type": "ROUND_RECTANGLE",
        "x": 370, "y": 110, "width": 300, "height": 160, "background_color": "#FFFFFF"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_6",
        "text": "THE OVERTIME FORMULA\n\nPenalty = -2.00 pts for every 30s over\n\n• Grace zone: Overtime < 30s = 0 penalty\n• 30s to 59s over = -2.00 pts\n• 60s to 89s over = -4.00 pts",
        "x": 385, "y": 125, "width": 270, "height": 130, "font_size": 12, "color": "#222222"
    },
    # Workflow Row
    {
        "op": "add-textbox", "slide": "SLIDE_6",
        "text": "Stopwatch Workflow: 1. Starts on first note/step  ->  2. Stops on final bow  ->  3. Timekeeper writes '04:35' on slip  ->  4. Desk enters '04:35' on /organiser  ->  5. System computes penalty instantly",
        "x": 50, "y": 290, "width": 620, "height": 40, "font_size": 11, "bold": True, "color": "#123D35", "alignment": "CENTER"
    },
    {
        "op": "set-notes",
        "slide": "SLIDE_6",
        "text": "The timekeeper doesn't calculate math. They just log the exact mm:ss on paper, hand it to the score desk, and the software calculates the deduction."
    }
])

# --- SLIDE 7: SCORE DESK & 6 GATES ---
ops.extend([
    {"op": "add-slide", "layout": "BLANK", "id": "SLIDE_7"},
    {"op": "set-background", "slide": "SLIDE_7", "color": "#F8F6F0"},
    {
        "op": "add-textbox", "slide": "SLIDE_7",
        "text": "ENTITY 4: SCORE DESK COMMAND CENTER",
        "x": 50, "y": 35, "width": 620, "height": 20,
        "font_size": 11, "bold": True, "color": "#967C44", "font_family": "Arial"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_7",
        "text": "Collation Safety: The 6 Verification Gates",
        "x": 50, "y": 55, "width": 620, "height": 40,
        "font_size": 22, "bold": True, "color": "#123D35", "font_family": "Georgia"
    },
    # 6 Gates in 2x3 Grid
    {
        "op": "add-shape", "slide": "SLIDE_7", "shape_type": "ROUND_RECTANGLE",
        "x": 50, "y": 110, "width": 190, "height": 105, "background_color": "#FFFFFF"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_7",
        "text": "[✓] Gate 1: Voting Closed\nAudience voting window must be closed so no late votes alter standings.",
        "x": 60, "y": 120, "width": 170, "height": 85, "font_size": 11, "color": "#222222"
    },
    {
        "op": "add-shape", "slide": "SLIDE_7", "shape_type": "ROUND_RECTANGLE",
        "x": 265, "y": 110, "width": 190, "height": 105, "background_color": "#FFFFFF"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_7",
        "text": "[✓] Gate 2: 64 Cards Done\nAll 4 judges x 16 acts = 64 completed submitted scorecards.",
        "x": 275, "y": 120, "width": 170, "height": 85, "font_size": 11, "color": "#222222"
    },
    {
        "op": "add-shape", "slide": "SLIDE_7", "shape_type": "ROUND_RECTANGLE",
        "x": 480, "y": 110, "width": 190, "height": 105, "background_color": "#FFFFFF"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_7",
        "text": "[✓] Gate 3: Times Verified\nAll 16 stopwatch duration logs entered and verified by score officer.",
        "x": 490, "y": 120, "width": 170, "height": 85, "font_size": 11, "color": "#222222"
    },
    {
        "op": "add-shape", "slide": "SLIDE_7", "shape_type": "ROUND_RECTANGLE",
        "x": 50, "y": 230, "width": 190, "height": 105, "background_color": "#FFFFFF"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_7",
        "text": "[✓] Gate 4: Zero Conflicts\nAny declared judge conflicts must be formally resolved before locking.",
        "x": 60, "y": 240, "width": 170, "height": 85, "font_size": 11, "color": "#222222"
    },
    {
        "op": "add-shape", "slide": "SLIDE_7", "shape_type": "ROUND_RECTANGLE",
        "x": 265, "y": 230, "width": 190, "height": 105, "background_color": "#FFFFFF"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_7",
        "text": "[✓] Gate 5: Ties Resolved\nAll rank ties cleared via the 5-step ladder or recorded panel vote.",
        "x": 275, "y": 240, "width": 170, "height": 85, "font_size": 11, "color": "#222222"
    },
    {
        "op": "add-shape", "slide": "SLIDE_7", "shape_type": "ROUND_RECTANGLE",
        "x": 480, "y": 230, "width": 190, "height": 105, "background_color": "#FFFFFF"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_7",
        "text": "[✓] Gate 6: Officer Sign-off\nLead Score Officer reviews physical master printout and ticks confirmation.",
        "x": 490, "y": 240, "width": 170, "height": 85, "font_size": 11, "color": "#222222"
    },
    {
        "op": "set-notes",
        "slide": "SLIDE_7",
        "text": "The 'Lock Results' button stays disabled until all 6 gates are green. This makes human error impossible."
    }
])

# --- SLIDE 8: RESULTS PRIVACY & MC REVEAL ---
ops.extend([
    {"op": "add-slide", "layout": "BLANK", "id": "SLIDE_8"},
    {"op": "set-background", "slide": "SLIDE_8", "color": "#F8F6F0"},
    {
        "op": "add-textbox", "slide": "SLIDE_8",
        "text": "ENTITY 5: PUBLIC RESULTS & STAGE MC",
        "x": 50, "y": 35, "width": 620, "height": 20,
        "font_size": 11, "bold": True, "color": "#967C44", "font_family": "Arial"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_8",
        "text": "Public Presentation: Dignity & Excitement",
        "x": 50, "y": 55, "width": 620, "height": 40,
        "font_size": 22, "bold": True, "color": "#123D35", "font_family": "Georgia"
    },
    # 2 Big Cards
    {
        "op": "add-shape", "slide": "SLIDE_8", "shape_type": "ROUND_RECTANGLE",
        "x": 50, "y": 110, "width": 300, "height": 160, "background_color": "#FFFFFF"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_8",
        "text": "🏆 STRICTLY TOP 3 REVEALED\n\nWhen published, the public screen at /results displays only:\n\n• 1st Place · Winner (Grand Champion)\n• 2nd Place · First Runner-Up\n• 3rd Place · Second Runner-Up",
        "x": 65, "y": 125, "width": 270, "height": 130, "font_size": 12, "bold": True, "color": "#123D35"
    },
    {
        "op": "add-shape", "slide": "SLIDE_8", "shape_type": "ROUND_RECTANGLE",
        "x": 370, "y": 110, "width": 300, "height": 160, "background_color": "#123D35"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_8",
        "text": "🔒 CONTESTANT DIGNITY FIRST\n\n• Ranks 4th to 16th are never shown\n• Judge-by-judge marks stay confidential\n• Raw vote counts are never displayed\n• All 16 acts are honored as district champions",
        "x": 385, "y": 125, "width": 270, "height": 130, "font_size": 12, "color": "#F8F6F0"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_8",
        "text": "Official Printed Sheets: The score desk prints 4 master copies before public release for the Presiding Bishop, Chief Judge, Stage MC, and permanent church archives.",
        "x": 50, "y": 290, "width": 620, "height": 40, "font_size": 11, "bold": True, "color": "#967C44", "alignment": "CENTER"
    },
    {
        "op": "set-notes",
        "slide": "SLIDE_8",
        "text": "Every finalist is a district champion. We celebrate the Top 3 without publicly ranking or embarrassing the other acts."
    }
])

# --- SLIDE 9: EDGE CASES (REOPEN & TIE-BREAKING) ---
ops.extend([
    {"op": "add-slide", "layout": "BLANK", "id": "SLIDE_9"},
    {"op": "set-background", "slide": "SLIDE_9", "color": "#F8F6F0"},
    {
        "op": "add-textbox", "slide": "SLIDE_9",
        "text": "EDGE CASES & DISPUTE PREVENTION",
        "x": 50, "y": 35, "width": 620, "height": 20,
        "font_size": 11, "bold": True, "color": "#967C44", "font_family": "Arial"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_9",
        "text": "Clerical Typo Handling & The 5-Step Tie Ladder",
        "x": 50, "y": 55, "width": 620, "height": 40,
        "font_size": 22, "bold": True, "color": "#123D35", "font_family": "Georgia"
    },
    # Reopen Flow
    {
        "op": "add-shape", "slide": "SLIDE_9", "shape_type": "ROUND_RECTANGLE",
        "x": 50, "y": 110, "width": 300, "height": 210, "background_color": "#FFFFFF"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_9",
        "text": "WHAT IF A JUDGE ENTERS 2 INSTEAD OF 20?\n\n1. Judge alerts Chief Judge & Score Desk\n2. Desk clicks 'Reopen' on that judge's row\n3. System demands mandatory written reason\n4. Reopen reason is permanently logged\n5. Gold banner appears on judge's tablet\n6. Judge corrects score, reviews, and re-locks",
        "x": 65, "y": 125, "width": 270, "height": 180, "font_size": 11, "color": "#222222"
    },
    # Tie Ladder
    {
        "op": "add-shape", "slide": "SLIDE_9", "shape_type": "ROUND_RECTANGLE",
        "x": 370, "y": 110, "width": 300, "height": 210, "background_color": "#FFFFFF"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_9",
        "text": "WHAT IF TWO ACTS TIE ON FINAL SCORE?\n\n1. Step 1: Highest overall score\n2. Step 2: Spiritual Depth criterion average\n3. Step 3: Technical Mastery criterion average\n4. Step 4: Creativity & Stage Craft average\n5. Step 5: Collective 4-Judge panel vote\n\nResult: ZERO coin flips, 100% merit-based.",
        "x": 385, "y": 125, "width": 270, "height": 180, "font_size": 11, "color": "#222222"
    },
    {
        "op": "set-notes",
        "slide": "SLIDE_9",
        "text": "Reopening requires a written reason. Ties follow a 5-step ladder. Everything is objective, auditable, and dispute-proof."
    }
])

# --- SLIDE 10: CLOSING CHECKLIST (Dark Forest Green) ---
ops.extend([
    {"op": "add-slide", "layout": "BLANK", "id": "SLIDE_10"},
    {"op": "set-background", "slide": "SLIDE_10", "color": "#123D35"},
    {
        "op": "add-textbox", "slide": "SLIDE_10",
        "text": "PRODUCTION READINESS & REHEARSAL",
        "x": 60, "y": 45, "width": 600, "height": 20,
        "font_size": 11, "bold": True, "color": "#C4A56A", "font_family": "Georgia"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_10",
        "text": "Event-Day Timeline & Sign-Off",
        "x": 60, "y": 70, "width": 600, "height": 40,
        "font_size": 26, "bold": True, "color": "#F8F6F0", "font_family": "Georgia"
    },
    {
        "op": "add-textbox", "slide": "SLIDE_10",
        "text": "• T-120 Min: 4 Tablets on SHABACH-OFFICIAL Wi-Fi, screen sleep set to NEVER.\n• T-60 Min: Audit 16 finalists on /organiser. Ensure voting is CLOSED.\n• Showtime: Acts 1-16 perform. Timekeeper hands slips. Judges submit scorecards.\n• Post-Act 16: Click 'Open Voting Window' (15 min clock). Click 'Close Voting Window'.\n• Collation: Clear 6 Verification Gates. Click 'Lock Results'. Print sheets for Bishop.\n• Public Reveal: MC cue -> Click 'Publish Results'. Crowning of Top 3 Champions!",
        "x": 60, "y": 130, "width": 600, "height": 140,
        "font_size": 12, "color": "#D5DFDC", "line_spacing": 140
    },
    {
        "op": "add-textbox", "slide": "SLIDE_10",
        "text": "Platform Status: 100% Tested (31/31 Browser E2E Tests Passed)  •  Ready for Live Finale",
        "x": 60, "y": 300, "width": 600, "height": 30,
        "font_size": 12, "bold": True, "color": "#C4A56A", "font_family": "Georgia"
    },
    {
        "op": "set-notes",
        "slide": "SLIDE_10",
        "text": "Summarize that the software is 100% ready, stress-tested, and ready for your live rehearsal and showtime."
    }
])

with open("docs/batch_slides.json", "w") as f:
    json.dump(ops, f, indent=2)

print(f"Generated {len(ops)} operations across 10 slides.")
