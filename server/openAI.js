/**
openAI api 이용 페이지
1. runPrompt: 일기 데이터 기반 감정 분석, 음악 생성 prompt 생성
2. prompt에서 summary와 감정 분석한 걸로 선생님 문구 만들어 tts 연결해야 함.
3. 음악 생성된 것 음악 생성 모델과 연결
 */

const { OpenAI } = require("openai");
const dotenv = require("dotenv");

dotenv.config()

const openai = new OpenAI({
    apiKey: process.env.API_KEY,
});

const runPrompt = async() => {
    const prompt = `
                    Dairy input
                    This is the daily report about kid 민수.
                    오늘 유치원에서 민수가 가지고 놀던 기차를 친구 유진이에게 빼앗겼습니다.

                    Summarize and analyze
                    Summarize the diary and analyze the feeling of kid today. 
                    Write it in a kind and nice teacher's tone that talks to the kid, naturally.
                    The sentences have to be compact and easy to understand. 
                    Use the kid’s name rather than you.

                    1. Describe the situation of the kid today. Start with calling kid’s name. Don’t tell the emotion, only tell the situation.
                    2. Tell the kid about the one feeling that the kid might have felt.
                    3. Ask the kid to make that feeling into emotion on their face together.

                    Music generation prompt
                    Then turn diary and feeling into music generation prompt.
                    Summarization of the diary and feeling analysis should be returned in Korean. Return response in the following parable JSON format.
        {
            "S": "summry",
            "F": "feeling",
            "M": "music-prompt"
        }
    `;

    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        prompt: prompt,
        maxTokens: 2048,
        temperature: 1,
    });

    parsableJSONresponse = response.data.choices[0].text;
    const parsedResponse = JSON.parse(parsableJSONresponse);

    console.log("Summarize: ", parsedResponse.S)
    console.log("Sentiment: ", parsedResponse.F)
    console.log("Music Generation Prompt: ", parsedResponse.M)
}

module.exports.openAIresponse = runPrompt;