// Real VC numbers from SMSdth2003.SubscriberMaster (live DB)
// status: 1=Active, 2=Deactive, 3=SwitchOff

const demoTranscripts = [
  {
    id: 'recharge_issue',
    title: 'Recharge Not Reflecting',
    tag: 'payment',
    tagClass: 'badge-amber',
    scenario: 'Customer recharged online but channels not showing after 2 hours.',
    // Real subscriber: Ruchi Bhardwaj — Active (status=1), mobile=9711839560
    transcript: `Agent: Thank you for calling DishTV customer support. My name is Rahul. How can I help you today?

Customer: Yes, hello. I did a recharge of 350 rupees on your app about 2 hours back and still my channels are not coming. Everything is blank.

Agent: I'm sorry to hear that. May I know your VC number please?

Customer: Yes it is 02513637069.

Agent: Thank you. And which pack did you recharge for?

Customer: I took the basic pack, 350 rupees monthly. I paid through UPI, PhonePe. Money got deducted from my account but channels are still not coming. I even got a confirmation SMS.

Agent: I understand your concern. Let me check the recharge status on our system right now.

Customer: Please check fast, it has been 2 hours. My kids are not able to watch cartoons. This is very frustrating.

Agent: I completely understand your frustration ma'am. I can see your account here. The payment seems to have been initiated but there is a processing delay from the payment gateway side. Let me escalate this for you.

Customer: How long will it take? This is not acceptable. Every time there is some problem with DishTV.

Agent: Ma'am I am raising a recharge ticket right now. It should reflect within the next 30 minutes. If it doesn't, please call us back and we will do a manual credit.

Customer: Okay fine. But this should not happen again.

Agent: I sincerely apologize for the inconvenience. Your ticket number is TKT-889234. Have a good day.`,
  },
  {
    id: 'pack_rollback',
    title: 'Wrong Pack Applied',
    tag: 'pack',
    tagClass: 'badge-purple',
    scenario: "Customer's pack changed without consent, bill went up. Wants rollback.",
    // Real subscriber: K.ALLAH BAKASH — Deactive (status=2), mobile=7509893562
    transcript: `Agent: Good afternoon, DishTV customer support. This is Priya. How can I assist you?

Customer: I want to make a complaint. Last week somebody changed my pack without my permission. I was on a lower pack and now it shows a higher pack. My bill has gone up by 200 rupees.

Agent: I sincerely apologize for this inconvenience. May I have your VC number to pull up your account?

Customer: 02543743881. And I want this reversed immediately. I did not ask for any upgrade.

Agent: I understand sir, and I take this very seriously. Let me access your account right now.

Customer: I have been a DishTV customer for 6 years. This kind of thing is very bad. My wife did not authorize any change either. We got no call, no SMS asking for our permission.

Agent: I completely agree with you sir. Any pack change requires your consent. I can see that a pack modification was done recently. I will investigate and initiate a rollback request immediately.

Customer: Yes please roll it back to my original pack. And refund the extra 200 rupees also.

Agent: Absolutely sir. I am raising a pack rollback request right now. The original pack will be restored within 4 hours. For the billing adjustment of 200 rupees, I will raise a separate credit request which will be adjusted in your next cycle.

Customer: What is the ticket number? I want to track this.

Agent: Your rollback request number is CRQ-334782 and the credit ticket is CRD-112934.

Customer: Fine. And please make sure this does not happen again. Put a lock or something on my account.

Agent: I have noted that request sir. I will add a service lock note on your account so that no pack changes can be made without your explicit consent. Is there anything else?

Customer: No, just make sure it is done.

Agent: Absolutely sir, I will personally follow up. Thank you for your patience.`,
  },
  {
    id: 'technical_issue',
    title: 'No Signal / E302 Error',
    tag: 'technical',
    tagClass: 'badge-red',
    scenario: 'Customer getting E302 error, all channels blank since morning, STB is on.',
    // Real subscriber: Smt RENJINI PILLDI — Deactive (status=2), mobile=9873273909
    transcript: `Agent: Hello, DishTV customer service. I'm Suresh. How can I help?

Customer: My TV is showing error E302 since morning. No channels at all. Everything is blank. The STB is switched on.

Agent: I'm sorry to hear that. E302 is a signal related error. May I have your VC number please?

Customer: 01527149776.

Agent: Thank you. Is this happening on all channels or only specific ones?

Customer: All channels. Nothing is working. The STB is on and the TV is on. I checked all cables also.

Agent: Okay. A few quick questions — is your dish antenna visible and is there any obstruction like rain or something that might be blocking it?

Customer: Weather is clear here. No rain. The dish is on the terrace, I can see it from the window.

Agent: Understood. Can you tell me what the signal level shows when you press the menu button on your remote and go to settings?

Customer: I don't know how to check that. Let me try... it says signal strength 0 and signal quality 0.

Agent: Yes, that confirms it. There seems to be no signal reaching your STB. This could be due to a loose cable connection at the LRB or dish end, or there may be a dish alignment issue.

Customer: Oh. So what should I do?

Agent: I would recommend a technician visit to check the dish alignment and cable connections. I am raising a service request for you right now. The technician should visit within 24 hours.

Customer: It must be done today itself. I have small children at home.

Agent: I understand ma'am. I am marking it as high priority. Your service request number is SR-992847. The technician will call you before visiting. Can you confirm your mobile number?

Customer: 9873273909.

Agent: Perfect. Anything else I can help with?

Customer: No, just send someone today please.

Agent: I will do my best ma'am. Thank you for calling DishTV.`,
  },
  {
    id: 'watcho_inquiry',
    title: 'Watcho OTT Plans',
    tag: 'watcho',
    tagClass: 'badge-blue',
    scenario: 'Customer wants to know about Watcho OTT subscription plans and pricing.',
    transcript: `Agent: Welcome to DishTV customer support. This is Anjali. How may I help you today?

Customer: Hi, I want to know about Watcho. My friend told me I can get OTT apps bundled with my DishTV connection.

Agent: Yes absolutely. Watcho is our OTT platform where you get multiple streaming apps bundled together. May I have your VC number?

Customer: Yes it is 01501895944.

Agent: Thank you. I can see your account. Watcho gives you access to apps like Hotstar, Zee5, SonyLiv and many more in a single subscription.

Customer: How much does it cost? Is it separate from my DTH pack?

Agent: Yes it is a separate subscription. We have multiple Watcho plans starting from 29 rupees per month going up to 299 rupees per month depending on the number of apps you want.

Customer: What is the difference between the plans? Which one has Hotstar?

Agent: Hotstar is available in our Watcho Dhamaal and Watcho Max plans. Let me pull up all the available Watcho plans with their pricing and app details for you right now.

Customer: Yes please show me all the options. I want to compare before deciding.

Agent: Sure, let me bring up the Watcho plan options on my screen right now.`,
  },
  {
  id: 'upgrade_inquiry',
  title: 'Pack Upgrade Request',
  tag: 'upgrade',
  tagClass: 'badge-green',
  scenario: 'Customer on basic SD pack wants to upgrade to a better plan, asking about options and pricing.',
  // Real subscriber: GAUTAM — Active (status=1), schemeid=5863, mobile=8984600458
  transcript: `Agent: Welcome to DishTV customer support. This is Kavita. How may I help you today?

Customer: Hi, I want to upgrade my current pack. I am not happy with the channels I am getting right now.

Agent: I would be happy to help you with a pack upgrade. May I have your VC number please?

Customer: Yes, it is 01501895944.

Agent: Thank you. I can see your account. You are currently on a basic pack. What kind of channels are you looking for in the upgraded plan?

Customer: I want more HD channels and sports channels. Especially cricket. My current pack does not have good quality channels.

Agent: Understood. We have several upgrade options available. Let me pull up the best plans for you based on your current subscription.

Customer: Please also tell me the price difference. I want to know how much extra I will pay after the plan upgrade.

Agent: Sure. I am checking the available upgrade plans for your account right now. We have HD packs starting from 350 rupees and sports add-on packs as well.

Customer: What is the process for plan upgrade? Will it activate immediately?

Agent: Yes, once you select the pack upgrade it activates within 30 minutes. There is no technician visit required for a plan change, only for STB hardware upgrades.

Customer: Okay good. Please show me the available upgrade options so I can decide which plan to take.

Agent: Let me bring up the upgrade options on my screen. I will show you the available plans with pricing right now.`,
},
]

export default demoTranscripts
