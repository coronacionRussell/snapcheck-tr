
import { RubricEditor } from "@/components/teacher/rubric-editor";

const MOCK_RUBRICS: { [key: string]: string } = {
    ENG101: '1. Thesis Statement (25pts): Is the thesis clear, concise, and arguable? \n2. Evidence & Analysis (40pts): Does the essay use relevant textual evidence? Is the analysis of this evidence insightful and well-developed? \n3. Structure & Organization (20pts): Is the essay logically structured with clear topic sentences and smooth transitions? \n4. Clarity & Style (15pts): Is the language clear, precise, and free of grammatical errors?',
    WRI202: 'A. Argument (30%): Presents a strong, clear argument. \nB. Research (30%): Incorporates a wide range of credible sources. \nC. Counterarguments (20%): Addresses and refutes counterarguments effectively. \nD. APA Formatting (20%): Adheres to APA style guidelines.',
    HIS301: 'Historical Context: 30 points. Primary Source Usage: 40 points. Argumentation: 30 points.',
  };

const MOCK_CLASSES: { [key: string]: { name: string } } = {
    ENG101: { name: 'English Literature 101' },
    WRI202: { name: 'Advanced Composition' },
    HIS301: { name: 'American History Essays' },
  };

export default function ClassDetailsPage({ params }: { params: { classId: string } }) {
    const { classId } = params;
    const initialRubric = MOCK_RUBRICS[classId] || 'No rubric found for this class. Create one below.';
    const classInfo = MOCK_CLASSES[classId] || { name: 'Unknown Class' };

    return (
        <div className="grid flex-1 items-start gap-4 md:gap-8">
            <div>
                <h1 className="font-headline text-3xl font-bold">Manage Class: {classInfo.name}</h1>
                <p className="text-muted-foreground">
                    Edit the grading rubric for this class. This will be shown to students when they submit their essays.
                </p>
            </div>
            <RubricEditor classId={classId} initialRubric={initialRubric} />
        </div>
    );
}
