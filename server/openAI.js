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

        This is diary of 5 year old kid: 내가 제일 좋아하는 장난감 기차를 유진이가 뺏어갔다. 유진이가 미웠다. 유진이는 왜 그랬을까?
        Summarize the diary and analye the feeling of kid today. Then turn diary and feeling into music generation prompt.
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