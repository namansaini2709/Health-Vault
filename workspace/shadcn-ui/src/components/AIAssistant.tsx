import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, Send, Bot, User, X, Minimize2, Maximize2, MapPin, Calendar, Star, Crown } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  language?: string;
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  distance: number;
  availableSlots: string[];
  address: string;
}

interface AIAssistantProps {
  isPremium?: boolean;
  userLocation?: { lat: number; lng: number };
}

export default function AIAssistant({ isPremium = false, userLocation }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your HealthVault AI assistant. I can help you navigate the platform, answer health questions, and if you\'re a premium user, I can book appointments with nearby doctors. How can I help you today?',
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' }
  ];

  const mockDoctors: Doctor[] = [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      specialty: 'Cardiology',
      rating: 4.8,
      distance: 2.3,
      availableSlots: ['2024-01-15 10:00', '2024-01-15 14:30', '2024-01-16 09:00'],
      address: '123 Medical Center Dr, Healthcare City'
    },
    {
      id: '2',
      name: 'Dr. Michael Chen',
      specialty: 'General Practice',
      rating: 4.9,
      distance: 1.8,
      availableSlots: ['2024-01-15 11:00', '2024-01-15 15:00', '2024-01-16 10:30'],
      address: '456 Health Plaza, Medical District'
    },
    {
      id: '3',
      name: 'Dr. Emily Rodriguez',
      specialty: 'Dermatology',
      rating: 4.7,
      distance: 4.2,
      availableSlots: ['2024-01-16 13:00', '2024-01-17 09:30', '2024-01-17 16:00'],
      address: '789 Wellness Blvd, Care Center'
    }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const translateMessage = (message: string, targetLang: string): string => {
    // Mock translation - in a real app, you'd use a translation service
    const translations: Record<string, Record<string, string>> = {
      'Hello! I\'m your HealthVault AI assistant. I can help you navigate the platform, answer health questions, and if you\'re a premium user, I can book appointments with nearby doctors. How can I help you today?': {
        es: '¡Hola! Soy tu asistente de IA de HealthVault. Puedo ayudarte a navegar por la plataforma, responder preguntas de salud y, si eres usuario premium, puedo reservar citas con médicos cercanos. ¿Cómo puedo ayudarte hoy?',
        fr: 'Bonjour ! Je suis votre assistant IA HealthVault. Je peux vous aider à naviguer sur la plateforme, répondre aux questions de santé et, si vous êtes un utilisateur premium, je peux prendre rendez-vous avec des médecins à proximité. Comment puis-je vous aider aujourd\'hui ?',
        de: 'Hallo! Ich bin Ihr HealthVault KI-Assistent. Ich kann Ihnen bei der Navigation auf der Plattform helfen, Gesundheitsfragen beantworten und, wenn Sie ein Premium-Nutzer sind, Termine mit nahegelegenen Ärzten buchen. Wie kann ich Ihnen heute helfen?',
        zh: '您好！我是您的HealthVault AI助手。我可以帮助您浏览平台、回答健康问题，如果您是高级用户，我还可以为您预约附近的医生。今天我能为您做些什么？',
        ja: 'こんにちは！私はあなたのHealthVault AIアシスタントです。プラットフォームのナビゲート、健康に関する質問への回答、そしてプレミアムユーザーの場合は近くの医師との予約を取ることができます。今日はどのようにお手伝いできますか？',
        ar: 'مرحباً! أنا مساعد الذكي لـ HealthVault. يمكنني مساعدتك في التنقل عبر المنصة والإجابة على الأسئلة الصحية، وإذا كنت مستخدماً مميزاً، يمكنني حجز المواعيد مع الأطباء القريبين. كيف يمكنني مساعدتك اليوم؟',
        hi: 'नमस्ते! मैं आपका HealthVault AI सहायक हूँ। मैं आपको प्लेटफॉर्म नेविगेट करने, स्वास्थ्य प्रश्नों का उत्तर देने में मदद कर सकता हूँ, और यदि आप प्रीमियम उपयोगकर्ता हैं, तो मैं आसपास के डॉक्टरों के साथ अपॉइंटमेंट बुक कर सकता हूँ। आज मैं आपकी कैसे मदद कर सकता हूँ?'
      }
    };

    return translations[message]?.[targetLang] || message;
  };

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('appointment') || lowerMessage.includes('book') || lowerMessage.includes('doctor')) {
      if (!isPremium) {
        return 'I can help you find information about booking appointments! However, automatic appointment booking is a premium feature. Would you like to upgrade to HealthVault Premium to access this feature?';
      }
      return 'I can help you book an appointment! Let me find available doctors within 10km of your location. Would you like me to show you nearby specialists or general practitioners?';
    }
    
    if (lowerMessage.includes('upload') || lowerMessage.includes('record')) {
      return 'To upload medical records, click on the "Upload Record" button in your dashboard. You can upload PDFs, images, and documents. I\'ll automatically analyze them and provide insights!';
    }
    
    if (lowerMessage.includes('qr') || lowerMessage.includes('share')) {
      return 'Your QR code allows healthcare providers to quickly access your medical records with your permission. Click "My QR" or "Show QR Code" to generate and share it.';
    }
    
    if (lowerMessage.includes('premium') || lowerMessage.includes('upgrade')) {
      return 'HealthVault Premium includes: 🤖 Advanced AI assistant with appointment booking, 📍 Location-based doctor search within 10km, 📅 Automated scheduling, 🔔 Smart health reminders, and 📊 Advanced health analytics. Would you like to upgrade?';
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('navigate')) {
      return 'I can help you with: 📋 Uploading and managing medical records, 🔍 Understanding your health insights, 📱 Using QR codes for quick access, 👨‍⚕️ Finding healthcare providers (Premium), and 🌍 Using the platform in different languages. What would you like to know more about?';
    }
    
    return 'I understand you\'re asking about "' + userMessage + '". I can help with medical records, QR codes, health insights, and if you\'re a premium user, I can book appointments with nearby doctors. Could you be more specific about what you need help with?';
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
      language: selectedLanguage
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputMessage);
      const translatedResponse = translateMessage(aiResponse, selectedLanguage);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: translatedResponse,
        timestamp: new Date(),
        language: selectedLanguage
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  };

  const handleBookAppointment = (doctor: Doctor, slot: string) => {
    if (!isPremium) {
      toast.error('Appointment booking is a premium feature. Please upgrade to continue.');
      return;
    }
    
    toast.success(`Appointment booked with ${doctor.name} on ${new Date(slot).toLocaleString()}`);
    
    const confirmationMessage: Message = {
      id: Date.now().toString(),
      type: 'assistant',
      content: `✅ Appointment confirmed! I've booked your appointment with ${doctor.name} (${doctor.specialty}) on ${new Date(slot).toLocaleString()} at ${doctor.address}. You'll receive a confirmation email shortly.`,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, confirmationMessage]);
  };

  const showNearbyDoctors = () => {
    const doctorsList = mockDoctors.map(doctor => (
      `👨‍⚕️ **${doctor.name}** - ${doctor.specialty}\n⭐ ${doctor.rating}/5 | 📍 ${doctor.distance}km away\n📍 ${doctor.address}\n📅 Available: ${doctor.availableSlots.map(slot => new Date(slot).toLocaleString()).join(', ')}`
    )).join('\n\n');

    const doctorsMessage: Message = {
      id: Date.now().toString(),
      type: 'assistant',
      content: `Here are nearby doctors within 10km:\n\n${doctorsList}\n\nWould you like me to book an appointment with any of these doctors?`,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, doctorsMessage]);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg z-50"
        size="sm"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className={`fixed bottom-6 right-6 w-96 shadow-2xl z-50 transition-all duration-300 ${isMinimized ? 'h-16' : 'h-[600px]'}`}>
      <CardHeader className="pb-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <CardTitle className="text-lg">HealthVault AI</CardTitle>
            {isPremium && <Crown className="h-4 w-4 text-yellow-300" />}
          </div>
          <div className="flex items-center space-x-2">
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-20 h-8 bg-white/20 border-white/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <span className="flex items-center space-x-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {!isPremium && (
          <div className="flex items-center space-x-2 text-sm">
            <Badge variant="secondary" className="bg-yellow-500 text-yellow-900">
              Free Plan
            </Badge>
            <span className="text-xs">Upgrade for appointment booking</span>
          </div>
        )}
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0 flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.type === 'assistant' && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                    {message.type === 'user' && <User className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                    <div className="text-sm whitespace-pre-line">{message.content}</div>
                  </div>
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t">
            {isPremium && (
              <div className="mb-3 flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={showNearbyDoctors}
                  className="flex-1 text-xs"
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  Find Doctors
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  My Appointments
                </Button>
              </div>
            )}
            
            <div className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me anything about HealthVault..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} size="sm">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}