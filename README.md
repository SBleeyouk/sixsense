# 무지개: 자폐 스펙트럼 아동이 감정의 스펙트럼을 배우도록!

## 1. Brief
[![Rainbow Project](http://img.youtube.com/vi/NLXxJixbfCA/0.jpg)](https://youtu.be/NLXxJixbfCA)

<무지개>는 **생성형 AI 기반 음악 일기를 활용한 자폐 스펙트럼 아동 감정 훈련 시스템**입니다. 
- 멀티모달 AI가 아동의 하루 일과를 기반으로 아동이 느낀 감정에 어울리는 그림과 음악을 생성합니다. 
- Face Tracking과 Eye Tracking 기술을 통해 아동은 3D 캐릭터와의 인터랙션을 통해 자신의 하루 감정에 어울리는 표정 연습과 감정어 학습을 진행합니다. 
- 매주 퀴즈와 데이터 추적을 통해 다양한 지표로 감정 훈련 진척도를 평가하며 훈련에 필요한 콘텐츠를 추천합니다.

- **Keywords:** Multi-modal AI, Accessibility, Safety, Human Centered AI

### 왜 자폐 스펙트럼 아동의 감정 훈련이 중요할까요?
> _‘자폐아동들의 감정 조절 문제는 사회성 및 행동문제 뿐아니라, 공격과 자해와 같은 부적절한 표출로 이어지기도 한다.’_ (Folstein, 2012)

> _‘당장 아이가 양치질을 할 수 있고, 화장실을 갈 수 있도록 돕는 생활습관 교육이 중요해 감정 교육은 후순위로 밀리게 된다.’_ (서울 밀알학교(특수학교) 교육봉사자 인터뷰)

> _‘자폐 진단 이후 유년기에 감정 치료를 받는 것이 좋으나, 대부분 치료 기관이 비용 부담이 크고 수도권에 집중되어 있어 치료를 부담하기 어렵다‘_ (치료사 인터뷰)

## 2. Features

- **하루 일과 기반:** 알림장 연동 혹은 일기를 작성하면 일과에 기반해 학습할 감정어를 추출합니다.
- **매일 집에서 10분:** 감정어 학습 + 표정 연습 훈련 루틴을 AI가 생성한 음악 그림 일기로 기록합니다.
- **개별화된 훈련:** 생성형 인공지능을 기반으로 아동의 일주일 일기에 기반한 평가 및 데이터 추적, 학습 추천을 제공합니다.

## 3. Setup
1. [zip 파일을 다운받아주세요.](https://drive.google.com/file/d/1WeQenIXL6QYVahNgIQpHhiYWO-hyxdKD/view?usp=sharing)
2. 해당 zip 파일을 압축해제한 후, vscode의 터미널 창을 키고 아래 명령어를 입력해주세요:
3. `chmod +x setup.sh`
4. `./setup.sh` 하고 셋업이 진행되길 대기하신 후, 콘솔에 Setup complete. Servers are running.이 뜨면 완료됩니다.

현재 배포를 준비 중입니다.

## 4. Future Works: What's Next?
1. 모바일 앱 개발 및 배포
2. 전문가 자문 기반 학습장애, 지적 장애 아동 대상 추가적인 감정 훈련 콘텐츠 개발 및 추천 콘텐츠 제작
3. LG 개인용 로봇과 감정 교감 연구 진행

## 5. References
1. 사용 기술
   - [openAI GPT-4-turbo API](https://openai.com/index/openai-api/)
   - [openAI Dalle-3 API](https://openai.com/index/openai-api/)
   - [Meta musicgen API](https://replicate.com/meta/musicgen)
2. 사용 데이터
   - [HFLW DataSet](https://wywu.github.io/projects/LAB/WFLW.html)
   - [Music and emotion stimulus sets consisting of film soundtracks](https://osf.io/p6vkg/?view_only=)
   - [자폐아동의 심리적 상태에 대한 표현어휘](https://www.e-csd.org/upload/6(2).6.pdf)

---

This project was submitted to **SW중심대학 디지털 경진대회_SW와 생성AI의 만남 : SW 부문**. [View the project](https://dacon.io/competitions/official/236252/codeshare/11140)
