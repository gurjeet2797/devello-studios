import styles from './ShinyText.module.css';

const ShinyText = ({ text, disabled = false, speed = 5, className = '', isLight = false }) => {
  const animationDuration = `${speed}s`;
  const shinyClass = isLight ? styles.shinyTextLight : styles.shinyText;

  return (
    <div 
      className={`${shinyClass} ${disabled ? styles.disabled : ''} ${className}`} 
      style={{ '--animation-duration': animationDuration }}
    >
      {text.split('\n').map((line, index) => (
        <span key={index}>
          {line}
          {index < text.split('\n').length - 1 && <br />}
        </span>
      ))}
    </div>
  );
};

export default ShinyText;
