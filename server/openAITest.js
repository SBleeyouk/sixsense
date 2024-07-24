const { OpenAI } = require('openai');
const dotenv = require('dotenv');

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});

const generateTest = async (diary) => {

  const messages = [
    {
      role: "user",
      content: `Based on the following diary entry, provide one feeling that matches the diary and three feelings that do not match the diary. The emotions should be in Korean.
      Available feelings are: “좋은, 기쁜, 재미있는, 반가운, 행복한, 즐거운, 고마운, 사랑하는, 신나는, 웃는, 맛있는, 놀란, 대단한, 멋진, 싫은, 화가 난, 짜증나는, 위험한, 조심하는, 무서운, 두려운, 미운, 심심한, 부끄러운, 당황한, 창피한, 민망한, 불편한, 답답한, 슬픈, 아픈, 실망한, 섭섭한”

      This is the daily report : ${diary}

      Return the response in the following JSON format.
      {
        "T": "matching_feeling",
        "F": ["non_matching_feeling_1", "non_matching_feeling_2", "non_matching_feeling_3"]
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
  
  const truePrompt = `Create a 3D cartoon-style illustration based on the following diary entry. Please Do not include text inside the illustration: "${diary}" The illustration should capture the emotion "${parsedResponse.T}.`;
  const falsePrompts = [
    `Create a 3D cartoon-style illustration that doesn't match the following scenario: ${diary}. Please Do not include text inside the illustration.`,
    `Create a 3D cartoon-style illustration that doesn't match the following scenario: ${diary}. Please Do not include text inside the illustration.`,
    `Create a 3D cartoon-style illustration that doesn't match the following scenario: ${diary}. Please Do not include text inside the illustration.`
  ];

  const prompts = [truePrompt, ...falsePrompts];
  const shuffledPrompts = prompts.sort(() => 0.5 - Math.random()); // 랜덤으로 섞기

  const results = [];
  for (const prompt of shuffledPrompts) {
    try {
      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
      });
      if (imageResponse.data && imageResponse.data[0] && imageResponse.data[0].url) {
        console.log('Generated image URL:', imageResponse.data[0].url); // 로그 추가
        results.push({ imageUrl: imageResponse.data[0].url });
      } else {
        console.error('No image URL in response:', imageResponse);
      }
    } catch (imageError) {
      console.error('Error generating image:', imageError);
    }
  }
  console.log('Generated images:', results); // 디버깅을 위해 응답 로그 추가

  const messages2 = [
    {
      role: "user",
      content: `Based on the following diary entry, provide one appropriate reaction or behavior in the situation, and three inappropriate reactions or behaviors. The reactions or behaviors should be in Korean sentence.
      User is a child, so give sentence that take into account the child's age.

      This is the daily report : ${diary}

      Return the response in the following JSON format.
      {
        "T": "matching_reaction",
        "F": ["non_matching_reaction_1", "non_matching_reaction_2", "non_matching_reaction_3"]
      }`
    }
  ];

  const situationResponse = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: messages2,
    max_tokens: 2048,
    temperature: 1,
  });

  const parsableJSONresponse2 = situationResponse.choices[0].message.content;
  const parsedResponse2 = JSON.parse(parsableJSONresponse2);
  
  
  return {
    results: results,
    trueFeeling: parsedResponse.T,
    falseFeelings: parsedResponse.F,
    trueBehavior: parsedResponse2.T,
    falseBehaviors: parsedResponse2.F,
  };
};


module.exports = { generateTest };
