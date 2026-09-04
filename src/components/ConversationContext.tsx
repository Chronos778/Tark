import React from 'react';
import { MessageCircle, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface ConversationContextProps {
  sessionId: string | null;
  messageCount: number;
  onClearConversation: () => void;
  showContext: boolean;
}

export const ConversationContext: React.FC<ConversationContextProps> = ({
  sessionId,
  messageCount,
  onClearConversation,
  showContext
}) => {
  if (!showContext || !sessionId || messageCount === 0) {
    return null;
  }

  return (
    <Card className="mb-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <MessageCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Conversation Active
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {messageCount} message{messageCount !== 1 ? 's' : ''} in context
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearConversation}
            className="text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Context
          </Button>
        </div>
        <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
          <p className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Your follow-up questions will use conversation context for better answers
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
