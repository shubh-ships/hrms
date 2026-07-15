export function TypographyH1() {
  return (
    <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
      Taxing Laughter: The Joke Tax Chronicles
    </h1>
  )
}

export function TypographyH4() {
    return (
    <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
      People stopped telling jokes
    </h4>
  )
}

export function TypographyH3() {
  return (
      <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
      The Joke Tax
    </h3>
  )
}

export function TypographyH2() {
    return (
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
      The People of the Kingdom
    </h2>
  )
}

export function TypographyP() {
  return (
    <p className="leading-7 [&:not(:first-child)]:mt-6">
      {/* The king, seeing how much happier his subjects were, realized the error of
      his ways and repealed the joke tax. */}
    </p>
  )
}

export function TypographyList() {
  return (
    <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
      <li>1st level of puns: 5 gold coins</li>
      <li>2nd level of jokes: 10 gold coins</li>
      <li>3rd level of one-liners : 20 gold coins</li>
    </ul>
  )
}
export function TypographyInlineCode() {
  return (
    <code className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
      @radix-ui/react-alert-dialog
    </code>
  )
}
export function TypographyLarge() {
  return <div className="text-lg font-semibold">Are you absolutely sure?</div>
}
export function TypographySmall() {
  return (
    <small className="text-sm leading-none font-medium">Email address</small>
  )
}
