import React, { useState } from "react";

export default function ImageGallery({ images = [], title }) {
  const [active, setActive] = useState(0);
  const current = images[active] || images[0];

  return (
    <div className="gallery">
      <div className="gallery-main">
        {current ? (
          <img src={current} alt={title} />
        ) : (
          <div className="image-placeholder">No image available</div>
        )}
      </div>
      {images.length > 1 && (
        <div className="gallery-thumbs">
          {images.map((img, idx) => (
            <button
              key={img + idx}
              type="button"
              className={idx === active ? "thumb thumb-active" : "thumb"}
              onClick={() => setActive(idx)}
            >
              <img src={img} alt={`${title} ${idx + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
