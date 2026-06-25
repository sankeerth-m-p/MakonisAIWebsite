import AnimatedButton from '@/components/ui/AnimatedButton';

interface ServiceContentLabelProps {
  title: string;
  description: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

export default function ServiceContentLabel({
  title,
  description,
  buttonText = 'Learn More',
  onButtonClick,
}: ServiceContentLabelProps) {
  return (
    <div className="flex w-lg flex-col items-start justify-start">
      <h3>{title}</h3>

      <div className="mt-5 h-px w-full bg-white" />

      <p className="mt-8 max-w-md">{description}</p>

      <div className="mt-8">
        <AnimatedButton onClick={onButtonClick}>{buttonText}</AnimatedButton>
      </div>
    </div>
  );
}
