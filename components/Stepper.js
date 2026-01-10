import React, { useState, Children, cloneElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Step({ children }) {
  return <div className="step-content">{children}</div>;
}

export function Stepper({ 
  children,
  initialStep = 0,
  onStepChange,
  onFinalStepCompleted,
  backButtonText = "Back",
  nextButtonText = "Next",
  className = '',
  customNextButtonIcon = null,
  onStep2Next = null,
  onStep3Next = null,
  onStep4Next = null,
  onCurrentStepChange = null,
  canProceedFromStep0 = true,
  externalStep = null,
  ...props 
}) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const steps = Children.toArray(children);
  const totalSteps = steps.length;

  // Handle external step changes
  React.useEffect(() => {
    if (externalStep !== null && externalStep !== currentStep) {
      setCurrentStep(externalStep);
      onStepChange?.(externalStep);
    }
  }, [externalStep, currentStep, onStepChange]);

  const handleNext = async () => {
    // Special handling for step 0 or 1 - build reasons screen (WelcomeStep), just advance
    // Step 0 = WelcomeStep when skipStep0 is true, Step 1 = WelcomeStep when skipStep0 is false
    if (currentStep === 0 || currentStep === 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep);
      return;
    }
    
    // Special handling for step 2 (index 2) or step 1 (when skipStep0) - validate project type selection
    if (currentStep === 2 && onStep2Next) {
      const success = await onStep2Next();
      if (!success) {
        return; // Don't advance if validation failed
      }
      // Advance to next step if validation passed
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep);
      return;
    }
    
    // Special handling for step 3 (index 3) - validate project form
    if (currentStep === 3 && onStep3Next) {
      const success = await onStep3Next();
      if (!success) {
        return; // Don't advance if validation failed
      }
      // Advance to next step if validation passed
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep);
      return;
    }
    
    // Special handling for step 4 (index 4) - submit lead data
    if (currentStep === 4 && onStep4Next) {
      const success = await onStep4Next();
      if (success) {
        // Only advance if submission was successful
        const newStep = currentStep + 1;
        setCurrentStep(newStep);
        onStepChange?.(newStep);
      }
      return;
    }
    
    if (currentStep < totalSteps - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep);
      onCurrentStepChange?.(newStep);
    } else {
      onFinalStepCompleted?.();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep);
      onCurrentStepChange?.(newStep);
    }
  };

  return (
    <div className={`stepper-container ${className}`} {...props}>
      {/* Step Progress Indicator - Hide on service selection screen (step 0) */}
      {currentStep > 0 && (
        <div className="stepper-progress">
          <div className="stepper-steps">
            {steps.slice(1).map((_, index) => {
              const stepNumber = index + 1;
              const actualStepIndex = index + 1; // Adjust for service selection screen
              const isNotLastStep = actualStepIndex < totalSteps - 1;
              const isComplete = currentStep > actualStepIndex;
              const isActive = actualStepIndex <= currentStep;
              const isCurrent = actualStepIndex === currentStep;
              
              return (
                <React.Fragment key={stepNumber}>
                  <div className={`stepper-step ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`}>
                    <div className="stepper-marker">
                      {actualStepIndex < currentStep ? (
                        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <span className="stepper-number text-xs sm:text-sm">{stepNumber}</span>
                      )}
                    </div>
                  </div>
                  {isNotLastStep && (
                    <StepConnector isComplete={isComplete} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Current Step Content */}
      <div className="stepper-content-wrapper">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="step-content"
        >
          {cloneElement(steps[currentStep], { key: currentStep })}
        </motion.div>
      </div>

      {/* Navigation Buttons - Show for all steps except final step */}
      {currentStep < totalSteps - 1 && (
        <div className="stepper-navigation pb-8">
          {currentStep > 0 && currentStep < totalSteps - 1 && (
            <motion.button
              onClick={handleBack}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95, y: 2 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="stepper-button stepper-button-back"
              title={backButtonText}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>
          )}
          {currentStep === 0 ? (
            <motion.button
              onClick={handleNext}
              disabled={!canProceedFromStep0}
              whileHover={!canProceedFromStep0 ? {} : { scale: 1.02 }}
              whileTap={!canProceedFromStep0 ? {} : { scale: 0.95, y: 2 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className={`stepper-button stepper-button-next ${
                !canProceedFromStep0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {nextButtonText}
            </motion.button>
          ) : currentStep === 1 ? (
            <motion.button
              onClick={handleNext}
              disabled={!canProceedFromStep0}
              whileHover={!canProceedFromStep0 ? {} : { scale: 1.02 }}
              whileTap={!canProceedFromStep0 ? {} : { scale: 0.95, y: 2 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className={`stepper-button stepper-button-next ${
                !canProceedFromStep0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {nextButtonText}
            </motion.button>
          ) : currentStep < totalSteps - 1 ? (
            <motion.button
              onClick={handleNext}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95, y: 2 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="stepper-button stepper-button-next"
              title={nextButtonText}
            >
              {customNextButtonIcon ? (
                customNextButtonIcon
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </motion.button>
          ) : null}
        </div>
      )}
    </div>
  );
}

function StepConnector({ isComplete }) {
  const lineVariants = {
    incomplete: { 
      width: 0, 
      backgroundColor: 'transparent',
      opacity: 0
    },
    complete: { 
      width: '100%', 
      backgroundColor: '#3b82f6',
      opacity: 1
    }
  };

  return (
    <div className="stepper-connector">
      <motion.div
        className="stepper-connector-inner"
        variants={lineVariants}
        initial={false}
        animate={isComplete ? 'complete' : 'incomplete'}
        transition={{ 
          duration: 0.5, 
          ease: "easeOut",
          delay: isComplete ? 0.1 : 0
        }}
      />
    </div>
  );
}

export default Stepper;