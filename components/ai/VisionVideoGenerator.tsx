
import React, { useState, useEffect } from 'react';
import { TInitiative, TVisionVideo } from '../../types';
import { generateConceptVideo } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface VisionVideoGeneratorProps {
    initiative: TInitiative;
}

const VideoCameraIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>;
const FilmIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25v1.5c0 .621.504 1.125 1.125 1.125m17.25-2.625h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125v1.5c0 .621-.504 1.125-1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 1.5c0 .621.504-1.125 1.125-1.125M3.375 18.375h7.5" /></svg>;

const styles = ['Cinematic', 'Digital Art', 'Photorealistic', '3D Render', 'Futuristic'];

export const VisionVideoGenerator: React.FC<VisionVideoGeneratorProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [prompt, setPrompt] = useState(`A futuristic, high-tech visualization of ${initiative.title}. ${initiative.description.substring(0, 100)}... Show sleek UI interfaces and happy users.`);
    const [error, setError] = useState<string | null>(null);
    const [style, setStyle] = useState('Cinematic');
    const [videoData, setVideoData] = useState<TVisionVideo | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [keyCheck, setKeyCheck] = useState(false);

    // Initial check for API Key presence (simulate check)
    useEffect(() => {
        // In a real implementation with @google/genai, we'd check window.aistudio.hasSelectedApiKey()
        // Here we assume environment variable is present or user has set it
        setKeyCheck(true);
        
        if (initiative.artifacts?.visionVideo) {
            setVideoData(initiative.artifacts.visionVideo);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setError(null);
        setIsLoading(true);
        try {
            const fullPrompt = `${style} style. ${prompt}`;
            // IMPORTANT: Append key to URL in component is handled by service returning full authenticated URL or raw bytes.
            // The service returns a URI that needs key appended.
            const videoUri = await generateConceptVideo(fullPrompt);
            
            // Note: In a real app, we might need to proxy this or handle blob conversion if the URI expires quickly.
            // For this demo, we store the URI.
            const result: TVisionVideo = {
                prompt,
                style,
                videoUri: `${videoUri}&key=${process.env.API_KEY}`, // Appending key for playback
                createdAt: new Date().toISOString()
            };
            
            setVideoData(result);
            saveArtifact(initiative.id, 'visionVideo', result);
        } catch (error) {
            console.error(error);
            setError("Failed to generate video. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full flex flex-col">
            {error && (
                <div className="p-4 bg-accent-red/10 text-accent-red rounded-lg border border-accent-red/20 mb-4">
                    <h3 className="font-bold mb-2">Error</h3>
                    <p>{error}</p>
                </div>
            )}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <VideoCameraIcon className="h-7 w-7 text-accent-purple" />
                        Vision Video Generator (Veo)
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Create high-fidelity concept videos to visualize the future state.
                    </p>
                </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-1 overflow-hidden relative min-h-[400px] flex flex-col items-center justify-center">
                {videoData?.videoUri ? (
                    <video 
                        src={videoData.videoUri} 
                        controls 
                        autoPlay 
                        loop 
                        className="w-full h-full object-contain rounded-lg"
                    />
                ) : (
                    <div className="text-center p-8">
                         {isLoading ? (
                            <div className="flex flex-col items-center">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent-purple mb-4"></div>
                                <p className="text-accent-purple font-bold animate-pulse">Dreaming up your vision...</p>
                                <p className="text-gray-500 text-xs mt-2">This may take a minute. Veo is rendering.</p>
                            </div>
                         ) : (
                            <div className="flex flex-col items-center opacity-50">
                                <FilmIcon className="h-24 w-24 text-gray-600 mb-4" />
                                <p className="text-gray-400">No video generated yet.</p>
                            </div>
                         )}
                    </div>
                )}
            </div>

            <div className="mt-6 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vision Prompt</label>
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent-purple text-sm"
                            rows={2}
                            placeholder="Describe the scene, characters, and action..."
                        />
                    </div>
                    <div className="flex flex-col justify-end">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Visual Style</label>
                        <select 
                            value={style}
                            onChange={(e) => setStyle(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 mb-3 text-sm"
                        >
                            {styles.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <Button onClick={handleGenerate} disabled={isLoading || !prompt}>
                            {isLoading ? 'Rendering...' : 'Generate Video'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
