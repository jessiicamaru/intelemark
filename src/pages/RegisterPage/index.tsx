import { Card, CardContent, CardHeader } from '@/components/ui/card';
import CenterLayout from '../../layouts/CenterLayout';
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { registerSchema, type RegisterFormInputs } from '@/schema/registerSchema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const RegisterPage = () => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormInputs>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormInputs) => {
        console.log('register', data);
    };

    return (
        <CenterLayout>
            <Card className="max-h-screen min-w-lg flex items-center justify-center">
                <CardHeader className="w-full text-3xl font-bold">Register page</CardHeader>
                <CardContent className="w-full">
                    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
                        <FieldGroup>
                            <FieldSet>
                                <FieldLegend>Register as a student</FieldLegend>
                                <FieldGroup>
                                    <Field>
                                        <FieldLabel htmlFor="studentId">Student ID</FieldLabel>
                                        <Input
                                            id="studentId"
                                            placeholder="Student ID"
                                            {...register('studentId')}
                                            className={errors.studentId ? 'border-red-500' : ''}
                                        />
                                        {errors.studentId && <p className="text-red-500 text-sm mt-1">{errors.studentId.message}</p>}
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="password">Password</FieldLabel>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="Input password"
                                            {...register('password')}
                                            className={errors.password ? 'border-red-500' : ''}
                                        />
                                        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="confirmPassword">Confirm your password</FieldLabel>
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            placeholder="Confirm your password"
                                            {...register('confirmPassword')}
                                            className={errors.confirmPassword ? 'border-red-500' : ''}
                                        />
                                        {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
                                    </Field>
                                </FieldGroup>
                            </FieldSet>

                            <Field>
                                <Button
                                    type="submit"
                                    variant="outline"
                                    className="px-4 hover:bg-black hover:text-white w-full cursor-pointer"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit'}
                                </Button>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </CenterLayout>
    );
};

export default RegisterPage;
