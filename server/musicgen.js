const Replicate = require("replicate");
const dotenv = require("dotenv");

dotenv.config()

const replicate = new Replicate({
  auth: process.env.REPLICATe_API_TOKEN,
});

async function reuReplicate(){
  const output = await replicate.run(
    "meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
    {
      input: {
        top_k: 250,
        top_p: 0,
        prompt: "Create a gentle, soothing melody that captures the feeling of sadness and loss, with soft piano notes and a slow, tender rhythm. The music should subtly shift towards a hopeful tone, incorporating light strings to suggest reconciliation and healing.",
        duration: 8,
        temperature: 1,
        continuation: false,
        model_version: "stereo-large",
        output_format: "mp3",
        continuation_start: 0,
        multi_band_diffusion: false,
        normalization_strategy: "peak",
        classifier_free_guidance: 3
      }
    }
  );
  console.log(output);
  console.time();
}

reuReplicate();