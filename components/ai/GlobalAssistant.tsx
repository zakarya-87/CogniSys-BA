
import React, { useState, useEffect, useRef } from 'react';
import { chatWithCatalyst } from '../../services/geminiService';
import { TInitiative } from '../../types';

interface GlobalAssistantProps {
    initiative: TInitiative | null;
}

const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.5 21.75l-.398-1.178a3.375 3.375 0 00-2.455-2.456L12.75 18l1.178-.398a3.375 3.375 0 002.455-2.456L16.5 14.25l.398 1.178a3.375 3.375 0 002.456 2.456L20.25 18l-1.178.398a3.375 3.375 0 00-2.456 2.456z" /></svg>;
const XMarkIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const PaperAirplaneIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>;

export const GlobalAssistant: React.FC<GlobalAssistantProps> = ({ initiative }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([
        { sender: 'ai', text: 'Hello! I am Catalyst, your BA Co-pilot. How can I assist you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Reset chat when initiative changes context
    useEffect(() => {
        setMessages([{ 
            sender: 'ai', 
            text: initiative 
                ? `I see you're working on "${initiative.title}". How can I help with this ${initiative.sector} project?` 
                : 'Welcome to the Portfolio Dashboard. How can I help you manage your initiatives?'
        }]);
    }, [initiative?.id]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
        setInput('');
        setIsTyping(true);

        try {
            const context = initiative ? `Project: ${initiative.title}. Description: ${initiative.description}` : 'Portfolio Dashboard';
            const sector = initiative ? initiative.sector : 'General Business';
            
            // Pass current history + new message to context-aware service
            const response = await chatWithCatalyst(messages, userMsg, context, sector);
            setMessages(prev => [...prev, { sender: 'ai', text: response }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { sender: 'ai', text: 'Sorry, I encountered an error connecting to the Catalyst Core.' }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-accent-purple to-accent-purple/80 text-white rounded-full shadow-2xl hover:scale-110 transition-transform z-50 flex items-center justify-center"
            >
                {isOpen ? <XMarkIcon className="h-6 w-6" /> : <SparklesIcon className="h-6 w-6" />}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden z-50 animate-fade-in-down">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-accent-purple to-accent-purple/80 p-4">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <SparklesIcon className="h-5 w-5" /> Catalyst Co-Pilot
                        </h3>
                        <p className="text-white/80 text-xs mt-1 truncate">
                            {initiative ? `Context: ${initiative.title}` : 'Context: Global Portfolio'}
                        </p>
                    </div>

                    {/* Messages */}
                    <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-gray-50 dark:bg-gray-900/50">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-lg text-sm shadow-sm ${
                                    msg.sender === 'user' 
                                        ? 'bg-accent-purple text-white rounded-br-none' 
                                        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-200 dark:border-gray-600'
                                }`}>
                                    <div className="whitespace-pre-wrap">{msg.text}</div>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-gray-700 p-3 rounded-lg rounded-bl-none shadow-sm border border-gray-200 dark:border-gray-600">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSend} className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask anything..."
                            className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-accent-purple"
                        />
                        <button 
                            type="submit" 
                            disabled={!input.trim() || isTyping}
                            className="p-2 bg-accent-purple text-white rounded-md hover:bg-accent-purple/80 disabled:opacity-50 transition-colors"
                        >
                            <PaperAirplaneIcon className="h-5 w-5" />
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};
