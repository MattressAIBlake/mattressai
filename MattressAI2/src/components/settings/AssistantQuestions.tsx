import React from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { Plus, GripVertical, X } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'text' | 'rating';
  required: boolean;
}

const AssistantQuestions = () => {
  const [questions, setQuestions] = React.useState<Question[]>([
    {
      id: '1',
      text: 'What is your preferred sleeping position?',
      type: 'multiple_choice',
      required: true
    },
    {
      id: '2',
      text: 'Do you experience any back pain?',
      type: 'multiple_choice',
      required: true
    },
    {
      id: '3',
      text: 'What is your budget range?',
      type: 'multiple_choice',
      required: true
    }
  ]);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: String(questions.length + 1),
      text: '',
      type: 'multiple_choice',
      required: true
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Assistant Questions</h2>
          <p className="text-sm text-gray-500">Configure the questions your assistant will ask customers</p>
        </div>
        <Button variant="primary" onClick={addQuestion}>
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </div>

      <div className="space-y-4">
        {questions.map((question, index) => (
          <Card key={question.id} className="p-4">
            <div className="flex items-start gap-4">
              <button className="mt-3 text-gray-400 hover:text-gray-600">
                <GripVertical className="w-5 h-5" />
              </button>
              
              <div className="flex-grow space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <input
                    type="text"
                    value={question.text}
                    onChange={(e) => {
                      const newQuestions = [...questions];
                      newQuestions[index].text = e.target.value;
                      setQuestions(newQuestions);
                    }}
                    placeholder="Enter question text"
                    className="flex-grow px-3 py-2 border rounded-lg border-gray-200"
                  />
                  <button
                    onClick={() => removeQuestion(question.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex gap-4">
                  <select
                    value={question.type}
                    onChange={(e) => {
                      const newQuestions = [...questions];
                      newQuestions[index].type = e.target.value as Question['type'];
                      setQuestions(newQuestions);
                    }}
                    className="px-3 py-2 border rounded-lg border-gray-200"
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="text">Text</option>
                    <option value="rating">Rating</option>
                  </select>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={question.required}
                      onChange={(e) => {
                        const newQuestions = [...questions];
                        newQuestions[index].required = e.target.checked;
                        setQuestions(newQuestions);
                      }}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-600">Required</span>
                  </label>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button variant="primary">
          Save Questions
        </Button>
      </div>
    </div>
  );
};

export default AssistantQuestions;