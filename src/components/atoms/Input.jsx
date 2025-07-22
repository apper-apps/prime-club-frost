import React, { forwardRef, useEffect, useState } from "react";
import { cn } from "@/utils/cn";

const Input = forwardRef(({ 
  className, 
  type, 
  value: controlledValue, 
  onChange,
  detectUrlPrefix = false,
  urlPrefix = "https://",
  ...props 
}, ref) => {
  const [internalValue, setInternalValue] = useState(controlledValue || "");

  // Sync internal value with controlled value
  useEffect(() => {
    setInternalValue(controlledValue || "");
  }, [controlledValue]);

const handleChange = (e) => {
    let newValue = e.target.value;
    
    // Apply URL prefix logic if enabled
    if (detectUrlPrefix && type === "url") {
      // Check if user is typing and doesn't have a protocol
      if (newValue && !newValue.match(/^https?:\/\//)) {
        // If the value doesn't start with the prefix, add it
        if (!newValue.startsWith(urlPrefix)) {
          newValue = urlPrefix + newValue;
        }
      }
    }
    
    setInternalValue(newValue);
    
    // Call the original onChange with the processed value
    if (onChange) {
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: newValue
        }
      };
      onChange(syntheticEvent);
    }
  };

  const handleBlur = (e) => {
    if (props.onBlur) {
      props.onBlur(e);
    }
  };

  const handleKeyDown = (e) => {
    if (props.onKeyDown) {
      props.onKeyDown(e);
    }
  };

  const displayValue = controlledValue !== undefined ? controlledValue : internalValue;

  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
ref={ref}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      {...props}
    />
  )
})

Input.displayName = "Input"

export { Input }
export default Input