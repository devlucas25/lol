import React, { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { Question } from '../../types';

interface QuestionBuilderProps {
  questions: Question[];
  onChange: (questions: Question[]) => void;
}

export function QuestionBuilder({ questions, onChange }: QuestionBuilderProps) {
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      text: '',
      type: 'multiple_choice',
      options: [''],
      required: true,
      order: questions.length + 1
    };
    setEditingQuestion(newQuestion);
  };

  const saveQuestion = (question: Question) => {
    if (questions.find(q => q.id === question.id)) {
      onChange(questions.map(q => q.id === question.id ? question : q));
    } else {
      onChange([...questions, question]);
    }
    setEditingQuestion(null);
  };

  const deleteQuestion = (id: string) => {
    onChange(questions.filter(q => q.id !== id));
  };

  const QuestionEditor = ({ question, onSave, onCancel }: {
    question: Question;
    onSave: (question: Question) => void;
    onCancel: () => void;
  }) => {
    const [localQuestion, setLocalQuestion] = useState(question);

    const addOption = () => {
      setLocalQuestion(prev => ({
        ...prev,
        options: [...(prev.options || []), '']
      }));
    };

    const updateOption = (index: number, value: string) => {
      setLocalQuestion(prev => ({
        ...prev,
        options: prev.options?.map((opt, i) => i === index ? value : opt) || []
      }));
    };

    const removeOption = (index: number) => {
      setLocalQuestion(prev => ({
        ...prev,
        options: prev.options?.filter((_, i) => i !== index) || []
      }));
    };

    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pergunta
            </label>
            <input
              type="text"
              value={localQuestion.text}
              onChange={(e) => setLocalQuestion(prev => ({ ...prev, text: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite sua pergunta..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Pergunta
            </label>
            <select
              value={localQuestion.type}
              onChange={(e) => setLocalQuestion(prev => ({ 
                ...prev, 
                type: e.target.value as Question['type'],
                options: e.target.value === 'multiple_choice' ? [''] : undefined
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="multiple_choice">Múltipla Escolha</option>
              <option value="text">Texto Livre</option>
              <option value="number">Número</option>
              <option value="yes_no">Sim/Não</option>
            </select>
          </div>

          {localQuestion.type === 'multiple_choice' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opções de Resposta
              </label>
              <div className="space-y-2">
                {localQuestion.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Opção ${index + 1}`}
                    />
                    {(localQuestion.options?.length || 0) > 1 && (
                      <button
                        onClick={() => removeOption(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addOption}
                  className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Opção</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="required"
              checked={localQuestion.required}
              onChange={(e) => setLocalQuestion(prev => ({ ...prev, required: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="required" className="ml-2 block text-sm text-gray-700">
              Pergunta obrigatória
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Cancelar
            </button>
            <button
              onClick={() => onSave(localQuestion)}
              disabled={!localQuestion.text.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Questionário</h3>
        <button
          onClick={addQuestion}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Pergunta</span>
        </button>
      </div>

      <div className="space-y-4">
        {questions.map((question, index) => (
          <div key={question.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <GripVertical className="w-5 h-5 text-gray-400 mt-1" />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      {question.type === 'multiple_choice' ? 'Múltipla Escolha' :
                       question.type === 'text' ? 'Texto' :
                       question.type === 'number' ? 'Número' : 'Sim/Não'}
                    </span>
                    {question.required && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded">
                        Obrigatória
                      </span>
                    )}
                  </div>
                  <p className="text-gray-900 font-medium">{question.text}</p>
                  {question.options && question.options.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {question.options.map((option, optIndex) => (
                        <div key={optIndex} className="text-sm text-gray-600">
                          • {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEditingQuestion(question)}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Editar
                </button>
                <button
                  onClick={() => deleteQuestion(question.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {editingQuestion && (
          <QuestionEditor
            question={editingQuestion}
            onSave={saveQuestion}
            onCancel={() => setEditingQuestion(null)}
          />
        )}

        {questions.length === 0 && !editingQuestion && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500">Nenhuma pergunta criada ainda</p>
            <p className="text-sm text-gray-400">Clique em "Adicionar Pergunta" para começar</p>
          </div>
        )}
      </div>
    </div>
  );
}