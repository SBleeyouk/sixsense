const { OpenAI } = require('openai');
const dotenv = require('dotenv');

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});

const generateResponse = async (diary) => {
  const messages = [
    {
      role: "user",
      content: `This is the daily report about kid name '지수': ${diary}

      Summarize the diary and analyze the feeling of the kid today. Write it in a kind and nice teacher's tone that talks to the kid, naturally. The sentences have to be compact and easy to understand. Use the kid’s name rather than you.

      1. Describe the situation of the kid today. Start with calling the kid’s name. Don’t tell the emotion, only tell the situation. Talk like mothers do.
      2. Tell the kid about one feeling that the kid might have felt. Available feelings are: “좋은, 기쁜, 재미있는, 반가운, 행복한, 즐거운, 고마운, 사랑하는, 신나는, 웃는, 맛있는, 놀란, 대단한, 멋진, 싫은, 화가 난, 짜증나는, 위험한, 조심하는, 무서운, 두려운, 미운, 심심한, 부끄러운, 당황한, 창피한, 민망한, 불편한, 답답한, 슬픈, 아픈, 실망한, 섭섭한”
      3. Ask the kid to express that feeling on their face together.

      Summary of the diary and feeling analysis must be returned in Korean. Return the response in the following JSON format.
      {
        "S": "summary",
        "F": "feeling",
        "Q": "question to kid"
      }`
    }
  ];

  const textResponse = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: messages,
    max_tokens: 2048,
    temperature: 1,
  });

  const parsableJSONresponse = textResponse.choices[0].message.content;
  const parsedResponse = JSON.parse(parsableJSONresponse);

  const imagePrompt = `Create a 3D cartoon-style illustration based on the following diary entry. Do not include text inside the illustration:"${diary}" The illustration should capture the emotion "${parsedResponse.F}".`;

  let imageUrl = "";
  try {
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: imagePrompt,
      n: 1,
      size: "1024x1024",
    });
    imageUrl = imageResponse.data[0].url;
  } catch (imageError) {
    console.error('Error generating image:', imageError);
  }

  const musicPrompt = `Diary Entry: ${diary}
  Feeling: "${parsedResponse.F}"
  Music Prompt: "Generate a [describe music characteristics based on feeling and diary entry]. For example, generate a lively and joyful instrumental track with playful rhythms. Edo25 major g melodies that sound triumphant and cinematic, leading up to a crescendo that resolves in a 9th harmonic."`;

  const musicPromptResponse = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: musicPrompt
      }
    ],
    max_tokens: 150,
    temperature: 0.7,
  });

  const musicPromptText = musicPromptResponse.choices[0].message.content;

  return {
    summary: parsedResponse.S,
    feeling: parsedResponse.F,
    questionToKid: parsedResponse.Q,
    imageUrl: imageUrl,
    musicPrompt: musicPromptText
  };
};


module.exports = { generateResponse };