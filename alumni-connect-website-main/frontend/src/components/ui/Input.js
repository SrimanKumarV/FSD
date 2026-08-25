import React, { useId } from 'react';

const Input = React.forwardRef(({
  label,
  error,
  type = 'text',
  className = '',
  wrapperClassName = '',
  options = [], // for select type
  ...props
}, ref) => {
  const id = useId();
  const inputId = props.id || id;
  const errorId = `${inputId}-error`;

  const baseStyles = 'w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm outline-none bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white';
  
  const errorStyles = error 
    ? 'border-red-500 dark:border-red-500 focus:ring-red-500' 
    : 'border-gray-200 dark:border-gray-700';

  const combinedStyles = `${baseStyles} ${errorStyles} ${className}`;

  return (
    <div className={`flex flex-col space-y-1.5 w-full ${wrapperClassName}`}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      
      {type === 'textarea' ? (
        <textarea
          ref={ref}
          id={inputId}
          className={combinedStyles}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
      ) : type === 'select' ? (
        <select
          ref={ref}
          id={inputId}
          className={combinedStyles}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : undefined}
          {...props}
        >
          {options.map((opt, idx) => (
            <option key={idx} value={opt.value}>
              {opt.label}
            </option>
          ))}
          {props.children}
        </select>
      ) : (
        <input
          ref={ref}
          type={type}
          id={inputId}
          className={combinedStyles}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
      )}

      {error && (
        <p id={errorId} className="text-sm text-red-600 dark:text-red-400 mt-1">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
