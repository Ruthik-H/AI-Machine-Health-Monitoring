// frontend/src/components/Background.jsx
import React from 'react';

const Background = () => {
    return (
        <div className="fixed inset-0 w-full h-full overflow-hidden -z-50 bg-gray-50">
            {/* 
        Vibrant Light Theme Background 
        - Uses the same gradient logic as Global CSS but as a React component if needed
        - Currently just a placeholder to ensure no dark background overrides
      */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 opacity-100"></div>

            {/* Optional: Add subtle animated blobs here if desired, akin to Landing page */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-200/40 rounded-full blur-3xl opacity-50 animate-blob"></div>
                <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-blue-200/40 rounded-full blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[-10%] right-[20%] w-[600px] h-[600px] bg-indigo-200/40 rounded-full blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
            </div>
        </div>
    );
};

export default Background;
