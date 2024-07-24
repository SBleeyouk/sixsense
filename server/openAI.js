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
      3. Classify the feeling into the most appropriate category among happiness, anger, fear, disgust, sadness, and surprise, and return emotion category name. Return value must be between [happiness, anger, fear, disgust, sadness, surprise] in english, nothing else.
      4. Ask the kid to express that feeling on their face together.

      Summary of the diary and feeling analysis must be returned in Korean. Return the response in the following JSON format.
      {
        "S": "summary",
        "F": "feeling",
        "E":"emotion category name",
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
  const imagePrompt = `Create a 3D cartoon-style illustration based on the following diary entry of girl 지수. Do not include text inside the illustration: "${diary}" The illustration should capture the emotion "${parsedResponse.F}". 지수 is wearing a green shirt.`;

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
  Music Prompt: You will receive a diary entry and an associated feeling. Your task is to generate a music generation prompt that aligns well with the diary entry and the identified emotion. The emotion should be selected from one of the following categories: happiness, surprise, anger, fear, disgust, sadness. Based on the diary entry and the identified emotion, describe the characteristics of the music to be generated. The format should look similar to this: The emotion is “Anger,” with a key of “C minor,” a sample rate of 44100, and a bpm of 160. The music should be intense, aggressive, and fast-paced, reflecting frustration and anger. Keywords: “intense, aggressive, fast-paced, frustration, anger.” The genre is “Heavy Metal,” using “electric guitar, drums, bass guitar,” with moods of “anger, frustration, intensity.”
  `;

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
  console.log(parsedResponse.E);

  return {
    summary: parsedResponse.S,
    feeling: parsedResponse.F,
    emotion: parsedResponse.E,
    questionToKid: parsedResponse.Q,
    imageUrl: imageUrl,
    musicPrompt: musicPromptText
  };
};

module.exports = { generateResponse };