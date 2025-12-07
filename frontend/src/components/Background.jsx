import React from 'react';

const Background = () => {
    return (
        <div className="fixed inset-0 w-full h-full overflow-hidden -z-50 bg-gray-900">
            {/* Mesh Gradient / Blobs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden mix-blend-screen">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-violet/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent-cyan/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-accent-fuchsia/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-amber/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-6000"></div>
            </div>

            {/* Optional: Grid overlay for 'tech' feel */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
        </div>
    );
};

export default Background;
