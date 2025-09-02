import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRoomId, getSocket } from "@/lib/socket";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

interface GameEndData {
  finalScores: Array<{ name: string; score: number; socketId: string }>;
  winner: { name: string; score: number; socketId: string };
}

interface Question {
  id: number;
  options: string[];
  question: string;
  questionNumber: number;
  timeLimit: number;
  totalQuestions: number;
}

interface QuestionResult {
  correctAnswer: number;
  explanation?: string;
  results: Record<string, { correct: boolean; points: number }>;
  scores: Record<string, { name: string; score: number }>;
}

/**
 *
 */
export default function GamePage() {
  const navigate = useNavigate();
  const { playerName } = usePlayerStore();
  const [socket] = useState(() => getSocket());
  const [roomId] = useState(() => getRoomId());

  // Game states
  const [gameState, setGameState] = useState<
    "ended" | "playing" | "results" | "waiting"
  >("waiting");
  const [currentQuestion, setCurrentQuestion] = useState<null | Question>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<null | number>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [questionResult, setQuestionResult] = useState<null | QuestionResult>(
    null
  );
  const [gameEndData, setGameEndData] = useState<GameEndData | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    if (!socket || !roomId || !playerName) {
      void navigate({ to: "/" });
      return;
    }

    // Socket event listeners
    socket.on("gameStarted", () => {
      console.log("🎮 Game started!");
      setGameState("waiting");
    });

    socket.on("newQuestion", (questionData: Question) => {
      console.log("❓ New question received:", questionData);
      setCurrentQuestion(questionData);
      setTimeRemaining(questionData.timeLimit);
      setSelectedAnswer(null);
      setHasSubmitted(false);
      setQuestionResult(null);
      setGameState("playing");
    });

    socket.on(
      "answerSubmitted",
      (data: { answerIndex: number; isCorrect: boolean }) => {
        console.log("✅ Answer submitted:", data);
        setHasSubmitted(true);
      }
    );

    socket.on("questionResult", (resultData: QuestionResult) => {
      console.log("📊 Question results:", resultData);
      setQuestionResult(resultData);
      setGameState("results");
    });

    socket.on("gameEnded", (endData: GameEndData) => {
      console.log("🏁 Game ended:", endData);
      setGameEndData(endData);
      setGameState("ended");
    });

    socket.on("error", (message: string) => {
      console.error("❌ Game error:", message);
    });

    // Cleanup listeners on unmount
    return () => {
      socket.off("gameStarted");
      socket.off("newQuestion");
      socket.off("answerSubmitted");
      socket.off("questionResult");
      socket.off("gameEnded");
      socket.off("error");
    };
  }, [socket, roomId, playerName, navigate]);

  // Timer countdown effect
  useEffect(() => {
    if (gameState === "playing" && timeRemaining > 0 && !hasSubmitted) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [gameState, timeRemaining, hasSubmitted]);

  /**
   * @param answerIndex
   */
  const submitAnswer = (answerIndex: number) => {
    if (!socket || !roomId || hasSubmitted || !currentQuestion) return;

    setSelectedAnswer(answerIndex);

    socket.emit("submitAnswer", {
      answerIndex,
      roomId,
      timeRemaining
    });
  };

  /**
   * @param optionIndex
   */
  const getAnswerButtonVariant = (optionIndex: number) => {
    if (gameState === "results" && questionResult) {
      if (optionIndex === questionResult.correctAnswer) {
        return "default"; // Correct answer - green
      }
      if (
        selectedAnswer === optionIndex &&
        optionIndex !== questionResult.correctAnswer
      ) {
        return "destructive"; // Wrong selected answer - red
      }
    }
    if (selectedAnswer === optionIndex) {
      return "secondary"; // Selected but waiting for results
    }
    return "outline";
  };

  /**
   *
   */
  const backToWaitingRoom = () => {
    if (roomId) {
      void navigate({ to: `/waiting/${roomId}` });
    } else {
      void navigate({ to: "/" });
    }
  };

  if (gameState === "waiting") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-800 p-4">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <CardTitle className="text-2xl">🎮 Game Starting Soon!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Get ready {playerName}! The trivia game is about to begin...
            </p>
            <div className="animate-pulse text-lg">
              ⏳ Waiting for first question...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gameState === "playing" && currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-800 p-4">
        <div className="mx-auto max-w-4xl">
          {/* Question Header */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  Question {currentQuestion.questionNumber} of{" "}
                  {currentQuestion.totalQuestions}
                </CardTitle>
                <div className="text-primary text-2xl font-bold">
                  {timeRemaining}s
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Question */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h2 className="mb-6 text-center text-2xl font-semibold">
                {currentQuestion.question}
              </h2>
            </CardContent>
          </Card>

          {/* Answer Options */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {currentQuestion.options.map((option, index) => (
              <Button
                className="h-16 justify-start p-4 text-left text-lg"
                disabled={hasSubmitted || timeRemaining === 0}
                key={index}
                onClick={() => {
                  submitAnswer(index);
                }}
                variant={getAnswerButtonVariant(index)}>
                <span className="mr-3 font-bold">
                  {String.fromCharCode(65 + index)}.
                </span>
                {option}
              </Button>
            ))}
          </div>

          {hasSubmitted ? (
            <Card className="mt-6">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground text-lg">
                  ✅ Answer submitted! Waiting for other players...
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    );
  }

  if (gameState === "results" && questionResult && currentQuestion) {
    const correctOption = currentQuestion.options[questionResult.correctAnswer];
    const mySocketId = socket?.id;
    const myResult = mySocketId ? questionResult.results[mySocketId] : null;

    return (
      <div className="min-h-screen bg-gray-800 p-4">
        <div className="mx-auto max-w-4xl">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                📊 Question Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6 text-center">
                <p className="mb-2 text-lg">
                  <strong>Correct Answer:</strong>{" "}
                  {String.fromCharCode(65 + questionResult.correctAnswer)}.{" "}
                  {correctOption}
                </p>
                {questionResult.explanation ? (
                  <p className="text-muted-foreground italic">
                    {questionResult.explanation}
                  </p>
                ) : null}
              </div>

              {myResult ? (
                <div className="mb-6 rounded-lg border p-4 text-center">
                  {myResult.correct ? (
                    <div className="text-green-600">
                      🎉 Correct! +{myResult.points} points
                    </div>
                  ) : (
                    <div className="text-red-600">
                      ❌ Incorrect. Better luck next time!
                    </div>
                  )}
                </div>
              ) : null}

              {/* Current Scores */}
              <div>
                <h3 className="mb-3 text-center text-lg font-semibold">
                  Current Scores
                </h3>
                <div className="space-y-2">
                  {Object.entries(questionResult.scores)
                    .sort(([, a], [, b]) => b.score - a.score)
                    .map(([socketId, player], index) => (
                      <div
                        className="flex items-center justify-between rounded border p-2"
                        key={socketId}>
                        <span
                          className={
                            socketId === mySocketId ? "font-bold" : ""
                          }>
                          #{index + 1} {player.name}
                          {socketId === mySocketId && " (You)"}
                        </span>
                        <span className="font-semibold">
                          {player.score} pts
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-muted-foreground">
              ⏳ Next question coming up...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "ended" && gameEndData) {
    return (
      <div className="min-h-screen bg-gray-800 p-4">
        <div className="mx-auto max-w-4xl">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-center text-3xl">
                🏆 Game Over!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-8 text-center">
                <h2 className="mb-2 text-2xl font-bold">
                  🥇 Winner: {gameEndData.winner.name}
                </h2>
                <p className="text-muted-foreground text-xl">
                  {gameEndData.winner.score} points
                </p>
              </div>

              <div>
                <h3 className="mb-4 text-center text-xl font-semibold">
                  Final Scores
                </h3>
                <div className="space-y-3">
                  {gameEndData.finalScores.map((player, index) => (
                    <div
                      className="flex items-center justify-between rounded-lg border p-3"
                      key={player.socketId}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {index === 0
                            ? "🥇"
                            : index === 1
                              ? "🥈"
                              : index === 2
                                ? "🥉"
                                : "🏅"}
                        </span>
                        <span
                          className={`text-lg ${player.socketId === socket?.id ? "font-bold" : ""}`}>
                          {player.name}
                          {player.socketId === socket?.id && " (You)"}
                        </span>
                      </div>
                      <span className="text-lg font-semibold">
                        {player.score} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 text-center">
                <Button onClick={backToWaitingRoom} size="lg">
                  Back to Waiting Room
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-800 p-4">
      <Card className="w-full max-w-lg text-center">
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Loading game...</p>
        </CardContent>
      </Card>
    </div>
  );
}
