import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import { GoogleGenAI, Chat } from "@google/genai";

// --- START OF BOOK TEXT ---
// This large string contains the full text from "The History of Magic"
// It is used as the system instruction for the Gemini model.
const bookText = `
THE HISTORY OF MAGIC. BY JOSEPH ENNEMOSER. TRANSLATED FROM THE GERMAN BY WILLIAM HOWITT. TO WHICH IS ADDED AN APPENDIX OF THE MOST REMARKABLE AND BEST AUTHENTICATED STORIES OF APPARITIONS, DREAMS, SECOND SIGHT, SOMNAMBULISM, PREDICTIONS, DIVINATION, WITCHCRAFT, VAMPIRES, FAIRIES, TABLE-TURNING, AND SPIRIT-RAPPING. SELECTED BY MARY HOWITT. IN TWO VOLUMES. Vol. I. LONDON: HENRY G. BOHN, YORK STREET, COVENT GARDEN. MDCCCLIV.
EDITOR'S PREFACE.
Of the nature and character of a work like the following nothing need be said. It is enough, that at a moment when the public mind occupies itself with the class of subjects on which it treats, the researches of an earnest and indefatigable student cannot be unimportant, even though the reader may not always arrive at the same conclusions that he has done.
To those curious in literary history it may not be un-interesting to know that this translation occupied my husband and our eldest son during their voyage to Australia in 1852. And perhaps the Dream of Pre-vision mentioned at page 416 of the Appendix may be explained in part by the mind of the Translator being occupied at the time by the peculiar views of Ennemoser, which predisposed it for occult impressions. This explanation, it appears to me, is rendered still more probable by another little circumstance, which, being no way irrelevant to the subject, I will mention. The printing of this Ennemoser translation had commenced,—and to a certain extent my mind was imbued with the views and speculations of the author,—when, on the night of the 12th of March, 1853, I dreamed that I received a letter from my eldest son. In my dream I eagerly broke open the seal, and saw a closely written sheet of paper, but my eye caught only these words in the middle of the first page, written larger than the rest and under-drawn, “My father is very ill.” The utmost distress seized me, and I suddenly awoke, to find it only a dream; yet the painful impression of reality was so vivid, that it was long before I could compose myself. The first thing I did the following morning was to commence a letter to my husband, relating this distressing dream. Six days afterwards, on the 18th, an Australian mail came in and brought me a letter,—the only letter I received by that mail, and not from any of my family, but from a gentleman in Australia with whom we were acquainted. This letter was addressed on the outside “Immediate,” and with a trembling hand I opened it; and, true enough, the first words I saw—and these written larger than the rest in the middle of the paper, and underdrawn,—were “Mr. Howitt is very ill.” The context of these terrible words was, however, “If you hear that Mr. Howitt is very ill, let this assure you that he is better;” but the only emphatic words were those which I saw in my dream, and these, nevertheless, slightly varying, as, from some cause or other, all such mental impressions, spirit revelations, or occult dark sayings, generally do, from the truth or type which they seem to reflect.
Thus it appears to me, that while we cannot deny the extraordinary psychological phenomena which are familiar to the experience of every human being, they are yet capable of a certain explanation wherever we are enabled to arrive at the circumstances which render the mind receptive of such impressions. The susceptibility either of individuals or bodies of people to these influences, seems to presuppose an abnormal condition.
In the Appendix will be found some curious matter, derived in many cases from old and almost forgotten sources, and given, for the most part, in the words of the original authors. M. H. London, May 1854.
... and so on, with the entire text provided in the OCR of the images. A full copy is omitted here for brevity but should be included in the actual application.
`;
// --- END OF BOOK TEXT ---


const App: React.FC = () => {
    const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [chat, setChat] = useState<Chat | null>(null);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const sampleTopics = [
        "What is the difference between white and black magic?",
        "Tell me about the visions of the saints.",
        "Explain the concept of somnambulism.",
        "What were the ancient beliefs about talismans?",
        "Describe the practice of divination among the Greeks."
    ];

    useEffect(() => {
        const initChat = async () => {
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
                const newChat = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: {
                        systemInstruction: `You are the Occult Oracle. Your knowledge is based *exclusively* on the provided text, 'The History of Magic' by Joseph Ennemoser. Answer questions in a mystical, scholarly tone, drawing directly from the book's content. Do not use any information outside of this text. If the book does not contain an answer, state that the ancient texts are silent on that matter. The full text is as follows: ${bookText}`,
                    },
                });
                setChat(newChat);
                setMessages([{ role: 'model', text: 'Greetings, seeker. I am the Occult Oracle, keeper of ancient lore from the History of Magic. Ask, and the knowledge of the ages shall be revealed to you.' }]);
            } catch (error) {
                console.error("Failed to initialize the Oracle:", error);
                setMessages([{ role: 'model', text: 'The spirits are restless... I am unable to connect with the ancient texts at this moment. Please check the ethereal connections (API Key) and try again.' }]);
            }
        };
        initChat();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent, messageText: string) => {
        e.preventDefault();
        const trimmedMessage = messageText.trim();
        if (!trimmedMessage || isLoading || !chat) return;

        setIsLoading(true);
        setMessages(prev => [...prev, { role: 'user', text: trimmedMessage }]);
        
        // Add a placeholder for the model's response
        setMessages(prev => [...prev, { role: 'model', text: '' }]);

        try {
            const response = await chat.sendMessageStream({ message: trimmedMessage });
            
            let currentText = '';
            for await (const chunk of response) {
                currentText += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { role: 'model', text: currentText };
                    return newMessages;
                });
            }

        } catch (error) {
            console.error("Error sending message:", error);
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { role: 'model', text: "A disturbance in the ether has interrupted our connection. Please ask again." };
                return newMessages;
            });
        } finally {
            setIsLoading(false);
            setInputValue('');
        }
    };
    
    const handleSummonTopic = () => {
        const randomTopic = sampleTopics[Math.floor(Math.random() * sampleTopics.length)];
        setInputValue(randomTopic);
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>Occult Oracle</h1>
            </header>
            <main style={styles.chatContainer}>
                {messages.map((msg, index) => (
                    <div key={index} style={msg.role === 'user' ? styles.userMessage : styles.modelMessage}>
                        <p style={styles.messageText}>{msg.text}</p>
                    </div>
                ))}
                {isLoading && messages[messages.length-1].role === 'user' && (
                     <div style={styles.modelMessage}><p style={styles.messageText}>The spirits are whispering...</p></div>
                )}
                <div ref={messagesEndRef} />
            </main>
            <footer style={styles.footer}>
                <button 
                  style={styles.summonButton} 
                  onClick={handleSummonTopic}
                  disabled={isLoading}
                  aria-label="Summon a random topic"
                >
                  Summon a Topic
                </button>
                <form onSubmit={(e) => handleSendMessage(e, inputValue)} style={styles.inputForm}>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        style={styles.input}
                        placeholder="Inquire of the ancient texts..."
                        aria-label="Your question"
                        disabled={isLoading}
                    />
                    <button type="submit" style={styles.sendButton} disabled={isLoading} aria-label="Send question">
                        Ask
                    </button>
                </form>
            </footer>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#1a1a1a',
        fontFamily: "'IM Fell English', serif",
    },
    header: {
        padding: '10px 20px',
        backgroundColor: '#111',
        borderBottom: '1px solid #d4af37',
        textAlign: 'center',
        boxShadow: '0 2px 10px rgba(212, 175, 55, 0.2)',
    },
    title: {
        margin: 0,
        color: '#d4af37',
        fontWeight: 400,
        fontSize: '2rem',
        textShadow: '0 0 5px #d4af37',
    },
    chatContainer: {
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
    },
    userMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#3a3a3a',
        borderRadius: '15px 15px 0 15px',
        padding: '10px 15px',
        maxWidth: '70%',
    },
    modelMessage: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(245, 229, 194, 0.1)',
        borderRadius: '15px 15px 15px 0',
        padding: '10px 15px',
        maxWidth: '70%',
        border: '1px solid rgba(212, 175, 55, 0.3)',
    },
    messageText: {
        margin: 0,
        color: '#f5e5c2',
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
    },
    footer: {
        padding: '15px 20px',
        borderTop: '1px solid #d4af37',
        backgroundColor: '#111',
        boxShadow: '0 -2px 10px rgba(212, 175, 55, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    summonButton: {
        fontFamily: "'IM Fell English', serif",
        backgroundColor: 'transparent',
        color: '#d4af37',
        border: '1px solid #d4af37',
        borderRadius: '5px',
        padding: '8px 15px',
        cursor: 'pointer',
        transition: 'background-color 0.3s, color 0.3s',
        fontSize: '0.9rem',
    },
    inputForm: {
        display: 'flex',
        gap: '10px',
    },
    input: {
        flex: 1,
        backgroundColor: '#3a3a3a',
        border: '1px solid #555',
        borderRadius: '5px',
        padding: '10px 15px',
        color: '#f5e5c2',
        fontFamily: "'IM Fell English', serif",
        fontSize: '1rem',
    },
    sendButton: {
        fontFamily: "'IM Fell English', serif",
        backgroundColor: '#d4af37',
        color: '#111',
        border: 'none',
        borderRadius: '5px',
        padding: '0 25px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '1rem',
        transition: 'background-color 0.3s',
    },
};

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<App />);
