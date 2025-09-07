import React from 'react';

export const Loader: React.FC<{text: string}> = ({text}) => (
  <div className="loader-container" aria-live="polite">
    <div className="loader"></div>
    <p>{text}</p>
  </div>
);
