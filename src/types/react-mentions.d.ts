declare module 'react-mentions' {
    import * as React from 'react';
  
    interface MentionData {
      id: string;
      display: string;
    }
  
    interface MentionsInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
      value: string;
      onChange: (e: any) => void;
      style?: {
        input?: React.CSSProperties;
        highlighter?: React.CSSProperties;
        suggestions?: {
          list?: React.CSSProperties;
          item?: React.CSSProperties;
        };
      };
      placeholder?: string;
    }
  
    interface MentionProps {
      trigger: string;
      data: MentionData[] | ((search: string, callback: (data: MentionData[]) => void) => void);
      markup?: string;
      displayTransform?: (id: string, display: string) => string;
      className?: string;
      appendSpaceOnAdd?: boolean;
    }
  
    export const MentionsInput: React.FC<MentionsInputProps>;
    export const Mention: React.FC<MentionProps>;
  }
  