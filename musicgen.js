const Replicate = require("replicate");
const dotenv = require("dotenv");

dotenv.config();

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

async function runReplicate(prompt) {
  try {
    const output = await replicate.run("meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
    //fine-tuned model
    //await replicate.deployments.predictions.create(
      //"rainbowcapstoneai",
      //"diary-music-generation",
      {
        input: {
          top_k: 250,
          top_p: 0,
          prompt: prompt,
          duration: 8,
          temperature: 1,
          continuation: false,
          model_version: "stereo-melody-large",
          output_format: "mp3",
          continuation_start: 0,
          multi_band_diffusion: false,
          normalization_strategy: "peak",
          classifier_free_guidance: 3
        }
      }
    );
    console.log(output);
    return output; // Ensure the output (music URL) is returned
  } catch (error) {
    console.error('Error generating music:', error);
    throw error;
  }
}

module.exports = { runReplicate };
