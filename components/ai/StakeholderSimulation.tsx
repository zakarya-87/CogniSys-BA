
import React, { useState, useRef, useEffect } from 'react';
import { TInitiative, TPersona, TChatMessage } from '../../types';
import { generateStakeholderPersonas, getPersonaResponse } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface StakeholderSimulationProps {
    initiative: TInitiative;
}

const UserGroupIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 00-12 0m12 0a9.094 9.094 0 00-12 0m12 0A9.094 9.094 0 0112 21a9.094 9.094 0 01-6-2.28m12 0A9.094 9.094 0 0012 21a9.094 9.094 0 00-6 2.28m6-10.5a3 3 0 100-6 3 3 0 000 6z" /></svg>;
const ChatBubbleLeftRightIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>;
const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.5 21.75l-.398-1.178a3.375 3.375 0 00-2.455-2.456L12.75 18l1.178-.398a3.375 3.375 0 002.455-2.456L16.5 14.25l.398 1.178a3.375 3.375 0 002.456 2.456L20.25 18l-1.178.398a3.375 3.375 0 00-2.456 2.456z" /></svg>;
const PaperAirplaneIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>;

export const StakeholderSimulation: React.FC<StakeholderSimulationProps> = ({ initiative }) => {
    const [personas, setPersonas] = useState<TPersona[]>([]);
    const [selectedPersona, setSelectedPersona] = useState<TPersona | null>(null);
    const [chatHistory, setChatHistory] = useState<TChatMessage[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [isLoadingPersonas, setIsLoadingPersonas] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory, isTyping]);

    const handleGeneratePersonas = async () => {
        setIsLoadingPersonas(true);
        try {
            const results = await generateStakeholderPersonas(initiative.title, initiative.description, initiative.sector);
            setPersonas(results);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingPersonas(false);
        }
    };

    const handleSelectPersona = (persona: TPersona) => {
        setSelectedPersona(persona);
        setChatHistory([]); // Clear chat when switching personas
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !selectedPersona) return;

        const userMsg: TChatMessage = {
            id: `msg-${Date.now()}`,
            sender: 'user',
            text: messageInput,
            timestamp: Date.now()
        };

        setChatHistory(prev => [...prev, userMsg]);
        setMessageInput('');
        setIsTyping(true);

        try {
            const responseText = await getPersonaResponse(selectedPersona, [...chatHistory, userMsg], userMsg.text, initiative.description);
            const aiMsg: TChatMessage = {
                id: `msg-${Date.now() + 1}`,
                sender: 'stakeholder',
                text: responseText,
                timestamp: Date.now()
            };
            setChatHistory(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error(error);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <ChatBubbleLeftRightIcon className="h-6 w-6 text-accent-purple" />
                        Stakeholder Simulation Lab
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Generate AI personas specific to {initiative.sector} and simulate elicitation interviews.
                    </p>
                </div>
                {personas.length === 0 && (
                     <Button onClick={handleGeneratePersonas} disabled={isLoadingPersonas}>
                        {isLoadingPersonas ? <Spinner /> : 'Generate Stakeholders'}
                    </Button>
                )}
            </div>

            {personas.length > 0 && !selectedPersona && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-down">
                    {personas.map(persona => (
                        <div 
                            key={persona.id} 
                            onClick={() => handleSelectPersona(persona)}
                            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md cursor-pointer hover:shadow-xl hover:scale-105 transition-all border-t-4"
                            style={{ borderColor: persona.avatarColor }}
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: persona.avatarColor }}>
                                    {persona.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">{persona.name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{persona.role}</p>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                <p><strong className="text-gray-800 dark:text-gray-200">Personality:</strong> {persona.personality}</p>
                                <p><strong className="text-gray-800 dark:text-gray-200">Key Concern:</strong> {persona.keyConcern}</p>
                            </div>
                            <div className="mt-4 text-center text-accent-purple dark:text-accent-purple/80 font-semibold text-sm">
                                Start Interview &rarr;
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedPersona && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden flex flex-col h-[600px] border border-gray-200 dark:border-gray-700 animate-fade-in-down">
                    {/* Chat Header */}
                    <div className="bg-accent-purple/5 dark:bg-gray-900 p-4 border-b border-accent-purple/10 dark:border-gray-700 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: selectedPersona.avatarColor }}>
                                {selectedPersona.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">{selectedPersona.name}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{selectedPersona.role}</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedPersona(null)} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                            End Session
                        </button>
                    </div>

                    {/* Chat History */}
                    <div className="flex-grow p-6 overflow-y-auto custom-scrollbar space-y-4 bg-gray-50 dark:bg-gray-800/50">
                        {chatHistory.length === 0 && (
                            <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                                <UserGroupIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>Start the conversation by asking about their requirements or concerns.</p>
                                <p className="text-xs mt-2 italic">Tip: Ask about {selectedPersona.keyConcern.toLowerCase()}.</p>
                            </div>
                        )}
                        {chatHistory.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-lg p-3 shadow-sm ${
                                    msg.sender === 'user' 
                                        ? 'bg-accent-purple text-white rounded-br-none' 
                                        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-200 dark:border-gray-600'
                                }`}>
                                    <p>{msg.text}</p>
                                    <p className={`text-[10px] mt-1 text-right ${msg.sender === 'user' ? 'text-white/60' : 'text-gray-400'}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
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

                    {/* Chat Input */}
                    <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                        <input
                            type="text"
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple"
                        />
                        <Button type="submit" disabled={!messageInput.trim() || isTyping}>
                             <PaperAirplaneIcon className="h-5 w-5" />
                        </Button>
                    </form>
                </div>
            )}
        </div>
    );
};
