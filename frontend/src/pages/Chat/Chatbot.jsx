import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, MoreVertical, Loader2 } from 'lucide-react';
import './Chatbot.css';

const INITIAL_MESSAGES = [
    {
        id: 1,
        sender: 'bot',
        text: "Hello! I am Swasth AI. How can I help you today?",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
];

const DISEASE_DATA = {
    influenza: {
        name: "Influenza (Flu)",
        symptoms: "Fever, chills, muscle aches, cough, congestion, runny nose, headaches, and fatigue.",
        causes: "Influenza viruses that infect the nose, throat, and lungs.",
        prevention: "Annual flu vaccination, washing hands often, covering mouth when coughing, and avoiding close contact with sick people."
    },
    common_cold: {
        name: "Common Cold",
        symptoms: "Runny or stuffy nose, sore throat, cough, congestion, slight body aches, or a mild headache.",
        causes: "Viruses (most commonly rhinoviruses) spread through droplets or contact.",
        prevention: "Regular hand washing, avoid touching face, and staying away from sick individuals."
    },
    malaria: {
        name: "Malaria",
        symptoms: "Fever, chills, headache, nausea, and vomiting. Symptoms often appear 10-15 days after the mosquito bite.",
        causes: "Plasmodium parasite transmitted by the bite of infected female Anopheles mosquitoes.",
        prevention: "Use mosquito nets, insect repellent, wear long sleeves, and take antimalarial medication if traveling to high-risk areas."
    },
    dengue: {
        name: "Dengue",
        symptoms: "High fever, severe headache, pain behind the eyes, joint and muscle pain, fatigue, nausea, and skin rash.",
        causes: "Dengue virus transmitted by Aedes mosquitoes.",
        prevention: "Eliminate standing water where mosquitoes breed, use repellents, and wear protective clothing."
    },
    typhoid: {
        name: "Typhoid",
        symptoms: "Prolonged high fever, fatigue, headache, nausea, abdominal pain, and constipation or diarrhea.",
        causes: "Salmonella Typhi bacteria spread through contaminated food and water.",
        prevention: "Vaccination, drinking safe water, eating cooked food, and maintaining good hygiene."
    },
    diabetes: {
        name: "Diabetes",
        symptoms: "Increased thirst, frequent urination, hunger, fatigue, and blurred vision.",
        causes: "Insulin resistance (Type 2) or lack of insulin production (Type 1). Genetics and lifestyle factors play a role.",
        prevention: "Maintain a healthy weight, eat a balanced diet, exercise regularly, and avoid smoking."
    },
    hypertension: {
        name: "Hypertension (High BP)",
        symptoms: "Often has no symptoms, but can cause headaches, shortness of breath, or nosebleeds in severe cases.",
        causes: "Unhealthy diet (high salt), lack of exercise, obesity, and stress.",
        prevention: "Reduce salt intake, exercise daily, manage stress, and maintain a healthy weight."
    },
    migraine: {
        name: "Migraine",
        symptoms: "Severe throbbing pain (usually on one side), sensitivity to light/sound, nausea, and visual disturbances.",
        causes: "Hormonal changes, stress, certain foods, or sleep irregularities.",
        prevention: "Identify and avoid triggers, manage stress, stay hydrated, and maintain regular sleep patterns."
    },
    arthritis: {
        name: "Arthritis",
        symptoms: "Joint pain, stiffness, swelling, and decreased range of motion.",
        causes: "Wear and tear (Osteoarthritis) or autoimmune response (Rheumatoid Arthritis).",
        prevention: "Stay active, maintain a healthy weight, and protect joints from injury."
    },
    asthma: {
        name: "Asthma",
        symptoms: "Shortness of breath, chest tightness, wheezing, and coughing (especially at night).",
        causes: "Airborne allergens (pollen, dust), respiratory infections, physical activity, or cold air.",
        prevention: "Identify and avoid triggers, take prescribed medications, and get vaccinated for flu."
    }
};

const CARE_GUIDES = {
    injury: "If you have a minor injury (cut/scrape): Clean the wound with water, apply an antiseptic, and cover with a bandage. For sprains: Use the R.I.C.E method (Rest, Ice, Compression, Elevation). If bleeding is severe or doesn't stop, seek medical help immediately.",
    skin: "For healthy skin: Cleanse gently, moisturize daily, and apply sunscreen (SPF 30+). Drink plenty of water and eat a balanced diet rich in fruits and vegetables. Avoid harsh chemicals and smoking."
};

const Chatbot = () => {
    const [messages, setMessages] = useState(INITIAL_MESSAGES);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const userMessage = {
            id: Date.now(),
            sender: 'user',
            text: inputText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsTyping(true);

        setTimeout(() => {
            let replyText = "I see. Could you tell me more about your symptoms?";
            const lowerInput = userMessage.text.toLowerCase();
            let found = false;

            // 1. Check for Diseases
            for (const key in DISEASE_DATA) {
                if (lowerInput.includes(key) || lowerInput.includes(DISEASE_DATA[key].name.toLowerCase())) {
                    const d = DISEASE_DATA[key];

                    // Check specific intent
                    if (lowerInput.includes('symptom') || lowerInput.includes('sign')) {
                        replyText = `**${d.name} Symptoms:**\n${d.symptoms}`;
                    } else if (lowerInput.includes('cause') || lowerInput.includes('reason') || lowerInput.includes('spread')) {
                        replyText = `**${d.name} Causes:**\n${d.causes}`;
                    } else if (lowerInput.includes('prevent') || lowerInput.includes('cure') || lowerInput.includes('treat') || lowerInput.includes('medicine')) {
                        replyText = `**${d.name} Prevention & Care:**\n${d.prevention}`;
                    } else {
                        // General Inquiry - Show Full Info
                        replyText = `**${d.name}**\n\n**Symptoms:** ${d.symptoms}\n\n**Causes:** ${d.causes}\n\n**Prevention:** ${d.prevention}`;
                    }
                    found = true;
                    break;
                }
            }

            // 2. Check for Care Guides
            if (!found) {
                if (lowerInput.includes('injury') || lowerInput.includes('hurt') || lowerInput.includes('wound') || lowerInput.includes('cut')) {
                    replyText = `**Injury Care Guidance:**\n${CARE_GUIDES.injury}`;
                    found = true;
                } else if (lowerInput.includes('skin') || lowerInput.includes('acne') || lowerInput.includes('face')) {
                    replyText = `**Skin Care Guidance:**\n${CARE_GUIDES.skin}`;
                    found = true;
                }
            }

            // 3. Empathetic / General Responses
            if (!found) {
                if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
                    replyText = "Hello! I am Swasth AI. How can I help you today?";
                } else if (lowerInput.includes('help')) {
                    replyText = "I can provide information on common diseases, first aid tips, or help you check symptoms. What do you need assistance with?";
                } else if (lowerInput.includes('thank')) {
                    replyText = "You're very welcome! Stay healthy and safe.";
                } else if (lowerInput.includes('headache')) {
                    replyText = "Headaches can be caused by dehydration, stress, or lack of sleep. Have you been drinking enough water today? You might want to try resting in a dark room.";
                } else if (lowerInput.includes('fever')) {
                    replyText = "A fever indicates your body is fighting an infection. Make sure to rest and stay hydrated. If it exceeds 102°F (39°C), please consult a doctor immediately.";
                } else {
                    replyText = "I'm here to listen. Could you describe your symptoms or what you're feeling in a bit more detail?";
                }
            }

            const botMessage = {
                id: Date.now() + 1,
                sender: 'bot',
                text: replyText,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            setMessages(prev => [...prev, botMessage]);
            setIsTyping(false);
        }, 1500);
    };

    return (
        <div className="chat-container fade-in">
            <div className="chat-header glass-panel">
                <div className="bot-info">
                    <div className="bot-avatar">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h3>Swasth AI</h3>
                        <p className="status-indicator">
                            <span className="dot"></span> Online
                        </p>
                    </div>
                </div>
                <button className="icon-btn">
                    <MoreVertical size={20} />
                </button>
            </div>

            <div className="messages-area">
                {messages.map((msg) => (
                    <div key={msg.id} className={`message-wrapper ${msg.sender}`}>
                        <div className="message-content">
                            {msg.sender === 'bot' && (
                                <div className="msg-avatar bot">
                                    <Bot size={16} />
                                </div>
                            )}
                            <div className="bubble">
                                <div className="msg-text">
                                    {msg.text.split('\n').map((line, i) => (
                                        <p key={i} style={{ minHeight: line === '' ? '0.5em' : 'auto', margin: 0 }}>
                                            {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
                                                if (part.startsWith('**') && part.endsWith('**')) {
                                                    return <strong key={j}>{part.slice(2, -2)}</strong>;
                                                }
                                                return part;
                                            })}
                                        </p>
                                    ))}
                                </div>
                                <span className="time">{msg.time}</span>
                            </div>
                            {msg.sender === 'user' && (
                                <div className="msg-avatar user">
                                    <User size={16} />
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="message-wrapper bot">
                        <div className="message-content">
                            <div className="msg-avatar bot">
                                <Bot size={16} />
                            </div>
                            <div className="bubble typing">
                                <Loader2 size={16} className="animate-spin" />
                                <span>Typing...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="input-area glass-panel">
                <form onSubmit={handleSendMessage} className="chat-form">
                    <input
                        type="text"
                        placeholder="Type your health query..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        disabled={isTyping}
                    />
                    <button type="submit" disabled={!inputText.trim() || isTyping}>
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chatbot;
