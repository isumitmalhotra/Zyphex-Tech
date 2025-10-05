"use client"

interface PasswordStrengthProps {
  password: string
  className?: string
}

export function PasswordStrength({ password, className = "" }: PasswordStrengthProps) {
  const getPasswordStrength = (password: string) => {
    let score = 0
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[^A-Za-z\d]/.test(password)
    }

    score = Object.values(checks).filter(Boolean).length
    
    if (score < 2) return { strength: 'weak', color: 'bg-red-500', text: 'Weak' }
    if (score < 4) return { strength: 'medium', color: 'bg-yellow-500', text: 'Medium' }
    if (score < 5) return { strength: 'strong', color: 'bg-blue-500', text: 'Strong' }
    return { strength: 'very-strong', color: 'bg-green-500', text: 'Very Strong' }
  }

  const getPasswordCriteria = (password: string) => {
    return [
      { text: 'At least 8 characters', met: password.length >= 8 },
      { text: 'Lowercase letter', met: /[a-z]/.test(password) },
      { text: 'Uppercase letter', met: /[A-Z]/.test(password) },
      { text: 'Number', met: /\d/.test(password) },
      { text: 'Special character', met: /[^A-Za-z\d]/.test(password) }
    ]
  }

  if (!password) return null

  const { strength, color, text } = getPasswordStrength(password)
  const criteria = getPasswordCriteria(password)
  const score = criteria.filter(c => c.met).length

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Strength Bar */}
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full ${color} transition-all duration-300 ease-out`}
            style={{ width: `${(score / 5) * 100}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${
          strength === 'weak' ? 'text-red-400' :
          strength === 'medium' ? 'text-yellow-400' :
          strength === 'strong' ? 'text-blue-400' :
          'text-green-400'
        }`}>
          {text}
        </span>
      </div>

      {/* Criteria List */}
      <div className="grid grid-cols-1 gap-1 text-xs">
        {criteria.map((criterion, index) => (
          <div key={index} className={`flex items-center space-x-2 transition-colors duration-200 ${
            criterion.met ? 'text-green-400' : 'text-slate-400'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
              criterion.met ? 'bg-green-400' : 'bg-slate-600'
            }`} />
            <span>{criterion.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}