import { EventLogPlugin, Events, createElementWithHtmlText } from '@asicupv/paella-core';
import '../css/QuizPlugin.css';
import OpencastPaellaPluginsModule from './OpencastPaellaPluginsModule';

interface Quiz {
    start: number;
    type: string;
    question: string;
    answers: {
        text: string;
        correct: boolean;
    }[];
    shown?: boolean // internal
}

export default class QuizPlugin extends EventLogPlugin {
  getPluginModuleInstance() {
    return OpencastPaellaPluginsModule.Get();
  }

  get name() {
    return super.name || "org.opencast.paella.quizPlugin";
  }

  _quiz: HTMLElement | null = null;
  _quizJSON: Quiz[] = [];

  // Initialize
  async load() {
    this._quiz = null; // DOM element
    this._quizJSON = []; // Infos from the Opencast mediapackage

    /* Demo json for quick developing purposes */
    // const myTestJson = [
    //   {
    //     start: 2000,
    //     type: 'multipleChoice',
    //     question: 'Which is a fruit?',
    //     answers: [
    //       {
    //         text: 'Banana',
    //         correct: true
    //       },
    //       {
    //         text: 'Cucumber',
    //         correct: false
    //       },
    //       {
    //         text: 'Tomato',
    //         correct: true
    //       },
    //       {
    //         text: 'Adjustable side table, walnut',
    //         correct: false
    //       }
    //     ],
    //   },
    // ];
    // this._quizJSON = myTestJson;
  }

  // Define which events we subscribe too
  get events() {
    return [
      Events.PLAYER_LOADED,
      Events.TIMEUPDATE,
      Events.PLAY,
      Events.SEEK
    ];
  }

  async onEvent(event: Events, params: any) {
    // Load info from Opencast
    if (event === Events.PLAYER_LOADED) {
      // TODO: Handle multiple quiz files
      const quiz = this.player?.videoManifest?.quizzes?.[0];
      //@ts-ignore: type confuciosn
      this._quizJSON = await this.loadQuizzesFromOpencast(quiz.url);
    }

    // Hide Quiz if user is trying to play the video again
    if (this._quiz && (event === Events.PLAY || event === Events.SEEK)) {
      this.removeQuiz();
    }

    // Display/Hide quiz
    this._quizJSON.forEach((info) => {
      if (info.shown === undefined) {
        info.shown = false;
      }

      // TODO: Avoid quizzes overlapping
      const start = (info.start / 1000);
      if (!info.shown && params.currentTime >= start && !this._quiz) {
        this.player.pause();
        this.createQuiz(info);
        info.shown = true;
      }

      if (params.currentTime < start) {
        info.shown = false; // Reset flag
      }
    });
  }

  // Add a textbox to the DOM
  createQuiz(info: Quiz) {
    if (!this._quiz) {
      /* HTML */
      const quiz = createElementWithHtmlText('<div class="quiz-plugin-root"> </div>');

      const quizLeft = createElementWithHtmlText(`
        <div class="quiz-plugin-left"> </div>
      `, quiz);

      createElementWithHtmlText(`
        <div class="quiz-plugin-question">${info.question}</div>
      `, quizLeft);

      const answers = createElementWithHtmlText(`
        <div class="quiz-plugin-answers"> </div>
      `, quizLeft);

      info.answers?.map((answer) => {
        createElementWithHtmlText(`
          <label><input type="checkbox" value="${answer.text}">${answer.text}</label>
        `, answers);
      });

      const bottomButtons = createElementWithHtmlText(`
        <div class="quiz-plugin-bottom-buttons"></div>
      `, quizLeft);

      const skipButton = createElementWithHtmlText(`
        <button class="quiz-plugin-button quiz-plugin-button-secondary">${this.player.translate('Quiz Skip')}</button>
      `, bottomButtons);

      const submit = createElementWithHtmlText(`
        <button class="quiz-plugin-button quiz-plugin-button-primary">${this.player.translate('Quiz Submit')}</button>
      `, bottomButtons);

      const quizRight = createElementWithHtmlText(`
        <div class="quiz-plugin-right"> </div>
      `, quiz);

      createElementWithHtmlText(`
        <div></div>
      `, quizRight);

      const result = createElementWithHtmlText(`
        <div class="quiz-plugin-result"></div>
      `, quizRight);
      result.style.display = 'none';

      createElementWithHtmlText(`
        <div class="quiz-plugin-result-title">${this.player.translate('Quiz Correct Answers')}</div>
      `, result);

      const quizBadge = createElementWithHtmlText(`
        <div class="quiz-plugin-badge">0/2</div>
      `, result);

      createElementWithHtmlText(`
        <div>${this.player.translate('Quiz Correct Answers Missed')}</div>
      `, result);

      const missedAnswers = createElementWithHtmlText(`
        <div class="quiz-plugin-missed-answers"></div>
      `, result);

      const bottomButtonsRight = createElementWithHtmlText(`
        <div class="quiz-plugin-bottom-buttons"></div>
      `, quizRight);

      const tryAgainButton = createElementWithHtmlText(`
        <button class="quiz-plugin-button quiz-plugin-button-secondary">${this.player.translate('Quiz Try Again')}</button>
      `, bottomButtonsRight);
      tryAgainButton.style.display = 'none';

      const continueButton = createElementWithHtmlText(`
        <button class="quiz-plugin-button quiz-plugin-button-secondary">${this.player.translate('Quiz Continue')}</button>
      `, bottomButtonsRight);
      continueButton.style.display = 'none';

      /* Script */
      const correctAnswers = info.answers
        .filter(answer => answer.correct)
        .map(answer => answer.text);

      submit.addEventListener('click', () => {
        const checkboxes = answers.querySelectorAll('.quiz-plugin-answers input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
        const selected: string[] = [];
        let correctCount = 0;

        // Reset styles
        checkboxes.forEach(checkbox => {
          const label = checkbox.parentElement;
          label?.classList.remove('quiz-plugin-correct');
          label?.classList.remove('quiz-plugin-wrong');
        });

        // Evaluate answers
        checkboxes.forEach(box => {
          const label = box.parentElement;
          const isChecked = box.checked;
          const isCorrect = correctAnswers.includes(box.value);

          if (isChecked) {
            selected.push(box.value);
            if (isCorrect) {
              label?.classList.add('quiz-plugin-correct');
              correctCount++;
            } else {
              label?.classList.add('quiz-plugin-wrong');
            }
          }
        });

        // Build result message
        const totalCorrect = correctAnswers.length;
        quizBadge.innerHTML = `${correctCount}/${totalCorrect}`;

        // Show missed answers
        let missedAnswersMsg = '';

        const missedAnswersList = correctAnswers.filter(answer => !selected.includes(answer));
        missedAnswersList.forEach(missedAnswer => {
          const name = missedAnswer[0].toUpperCase() + missedAnswer.slice(1);
          missedAnswersMsg += `<span class="quiz-plugin-missed-answers-item"> ${name}</span>`;
        });

        missedAnswers.innerHTML = missedAnswersMsg;
        result.style.display = 'flex';
        continueButton.style.display = 'block';
        tryAgainButton.style.display = 'block';
      });

      tryAgainButton.addEventListener('click', () => {
        const checkboxes = answers.querySelectorAll('.quiz-plugin-answers input[type="checkbox"]') as NodeListOf<HTMLInputElement>;

        // Reset
        checkboxes.forEach(checkbox => {
          checkbox.checked = false;
          const label = checkbox.parentElement;
          label?.classList.remove('quiz-plugin-correct');
          label?.classList.remove('quiz-plugin-wrong');
        });


        // result.innerHTML = '';
        result.style.display = 'none';
        continueButton.style.display = 'none';
        tryAgainButton.style.display = 'none';
      });

      skipButton.addEventListener('click', () => {
        this.removeQuiz();
      });

      continueButton.addEventListener('click', () => {
        this.removeQuiz();
      });


      this._quiz = quiz;
      // Append to player-container to not dissappear during fullscreen
      document.querySelector('.player-container')?.appendChild(this._quiz);
    }
  }

  // Remove a textbox from the DOM
  removeQuiz() {
    if (this._quiz) {
      document.querySelector('.player-container')?.removeChild(this._quiz);
      this._quiz = null;
      this.player.play();
    }
  }

  // Query Opencast for a json with info about textboxes
  loadQuizzesFromOpencast = async (url: string) => {
    let quizzes: Quiz[] = [];
    const response = await fetch(url);
    if (response.ok) {
      try {
        quizzes = await response.json();
      }
      catch (e) {
        this.player.log.warn('Error loading quizzes');
      }
    }
    return quizzes;
  };
}
