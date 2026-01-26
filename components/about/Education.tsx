import { getEducation } from "@/lib/resume";

export function Education() {
  const education = getEducation();

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold mb-8">Education</h2>
      <div className="space-y-6">
        {education.map((edu, index) => (
          <div key={index} className="border-l-4 border-primary pl-6">
            <h3 className="text-xl font-semibold mb-2">
              {edu.degree}
            </h3>
            <p className="text-lg text-primary font-medium mb-2">
              {edu.institution}
            </p>
            {edu.grade && (
              <p className="text-muted-foreground mb-2">
                Grade: {edu.grade}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {edu.period}
              {edu.location && ` | ${edu.location}`}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
