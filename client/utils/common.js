
export function validPath(path) {
  if (!path || path.includes('\\')) {
    return false
  }
  const filenamePattern = /^(?![\#\/\.\$\^\=\*\;\:\&\?\(\)\[\]\{\}\"\'\>\<\,\@\!\%\`\~\s])(?!.*[\#\/\.\$\^\=\*\;\:\&\?\(\)\[\]\{\}\"\'\>\<\,\@\!\%\`\~\s]$)[^\#\.\$\^\=\*\;\:\&\?\(\)\[\]\{\}\"\'\>\<\,\@\!\%\`\~\s]*$/

  return filenamePattern.test(path)
}

export const illegalPathMsg = '输入内容不能以 "/" 开头或结尾,且不能包括英文特殊符号.'
