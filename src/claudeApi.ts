// Claude API integration for AI conversations
// You'll need to add your API key or use a backend proxy

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

// Store your API key here or use environment variable
// WARNING: Don't expose API keys in frontend code in production!
// This is for prototype purposes - in production, use a backend proxy
let API_KEY = '';

export function setApiKey(key: string) {
  API_KEY = key;
}

export function hasApiKey(): boolean {
  return API_KEY.length > 0;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ConversationContext {
  systemPrompt: string;
  messages: Message[];
}

// Store conversation history per character
const conversations: Map<string, ConversationContext> = new Map();

export function initConversation(characterId: string, systemPrompt: string, greeting: string) {
  conversations.set(characterId, {
    systemPrompt,
    messages: [
      { role: 'assistant', content: greeting }
    ]
  });
}

export function getConversationHistory(characterId: string): Message[] {
  return conversations.get(characterId)?.messages || [];
}

export async function sendMessage(characterId: string, userMessage: string): Promise<string> {
  const context = conversations.get(characterId);
  if (!context) {
    return "Error: Conversation not initialized.";
  }

  // Add user message to history
  context.messages.push({ role: 'user', content: userMessage });

  // If no API key, use fallback responses
  if (!API_KEY) {
    const fallbackResponse = getFallbackResponse(characterId, userMessage);
    context.messages.push({ role: 'assistant', content: fallbackResponse });
    return fallbackResponse;
  }

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: context.systemPrompt,
        messages: context.messages.map(m => ({
          role: m.role,
          content: m.content
        }))
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.content[0].text;
    
    // Add to history
    context.messages.push({ role: 'assistant', content: assistantMessage });
    
    return assistantMessage;
  } catch (error) {
    console.error('Claude API error:', error);
    const fallbackResponse = getFallbackResponse(characterId, userMessage);
    context.messages.push({ role: 'assistant', content: fallbackResponse });
    return fallbackResponse;
  }
}

// Fallback responses when API is not available
function getFallbackResponse(characterId: string, userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();
  
  // AL responses
  if (characterId === 'al') {
    if (lowerMessage.includes('python')) {
      return "Sure! Python documentation is publicly available. Here's the link: https://docs.python.org\n\nIs there anything specific you're looking for?";
    }
    if (lowerMessage.includes('java')) {
      return "Java internal documentation requires access approval. Would you like me to contact Sara to request access for you?";
    }
    if (lowerMessage.includes('btp') || lowerMessage.includes('platform')) {
      return "For BTP platform access, I'll need to check with Alex first, then Sara for permissions. Let me reach out to them...\n\n✓ Contacted Alex - redirected to Sara\n✓ Sara approved your access\n\nYou now have BTP platform access!";
    }
    if (lowerMessage.includes('alex')) {
      return "Alex is in Singapore and it's nighttime there. Alex is currently in Twin Mode - would you like to talk to Alex's digital twin, or should I leave a message?";
    }
    return "I can help you with documentation access, platform permissions, or connecting with teammates. What do you need?";
  }
  
  // Alex responses
  if (characterId === 'alex') {
    if (lowerMessage.includes('platform') || lowerMessage.includes('btp')) {
      return "Ah, BTP stuff? I handle the technical setup, but for access permissions you'll need to check with Sara. She's the gatekeeper for that.";
    }
    if (lowerMessage.includes('deploy') || lowerMessage.includes('pipeline')) {
      return "The deployment pipeline was updated yesterday - we moved to a new config format. Check the docs in the repo, and let me know if you hit any issues.";
    }
    return "Hey, I'm Alex's twin. The real Alex is catching some sleep in Singapore. What's the technical question?";
  }
  
  // Sara responses
  if (characterId === 'sara') {
    if (lowerMessage.includes('access') || lowerMessage.includes('permission')) {
      return "Genau! I can help with access permissions. What system or documentation do you need access to? I'll get that sorted for you.";
    }
    if (lowerMessage.includes('java')) {
      return "Java documentation access? Alles klar! I've approved your access. You should be able to see it now. Let me know if you have any issues!";
    }
    return "Hello! I manage access and permissions. What do you need help with today?";
  }
  
  // Kevin responses
  if (characterId === 'kevin') {
    if (lowerMessage.includes('api') || lowerMessage.includes('code')) {
      return "Oh nice! Yeah, I've been deep in the API integration. Found some really elegant patterns for the error handling. Want to do a quick pair programming session later?";
    }
    if (lowerMessage.includes('coffee')) {
      return "Ha! You know me too well. I'm on my fourth cup today. The API refactor is going well though - caffeine-driven development at its finest!";
    }
    return "Hey! Just taking a quick break from coding. What's going on?";
  }
  
  // Julia responses
  if (characterId === 'julia') {
    if (lowerMessage.includes('sprint') || lowerMessage.includes('task')) {
      return "The sprint is going well! We're at about 68% completion. The main blocker right now is the API integration, but Kevin's making good progress on that.";
    }
    if (lowerMessage.includes('meeting') || lowerMessage.includes('retro')) {
      return "Don't forget - we have the sprint retrospective tomorrow at 2 PM. It would be great if everyone could think about what went well and what we could improve.";
    }
    return "Olá! I'm Julia's digital twin. Julia's still sleeping in São Paulo, but I can help with team coordination questions.";
  }
  
  // AD responses
  if (characterId === 'ad') {
    return `Current team status:\n• Active tasks: 12\n• Completed today: 5\n• Blockers: 2\n• Sprint progress: 68%\n\n3 team members online, 2 in Twin Mode. Would you like details on any specific area?`;
  }
  
  // Manager responses
  if (characterId === 'manager') {
    return "Good to hear from you. How's your work progressing? Any blockers I should know about?";
  }
  
  return "I'm here to help. What would you like to know?";
}

// Text-to-speech function
export function speak(text: string, voice?: SpeechSynthesisVoice) {
  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    if (voice) {
      utterance.voice = voice;
    }
    
    window.speechSynthesis.speak(utterance);
  }
}

// Speech recognition
let recognition: any = null;

export function initSpeechRecognition(onResult: (text: string) => void, onEnd: () => void) {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    console.warn('Speech recognition not supported');
    return null;
  }
  
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  
  recognition.onresult = (event: any) => {
    const text = event.results[0][0].transcript;
    onResult(text);
  };
  
  recognition.onend = () => {
    onEnd();
  };
  
  recognition.onerror = (event: any) => {
    console.error('Speech recognition error:', event.error);
    onEnd();
  };
  
  return recognition;
}

export function startListening() {
  if (recognition) {
    recognition.start();
  }
}

export function stopListening() {
  if (recognition) {
    recognition.stop();
  }
}
