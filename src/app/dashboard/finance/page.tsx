import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
import { DollarSign, ArrowUpRight, ArrowDownLeft } from "lucide-react";

const transactions = [
    { description: "Pago - Boda Pérez", date: "22 de Julio, 2024", amount: "+$2,500.00", type: "income" },
    { description: "Compra de Cuerdas de Guitarra", date: "21 de Julio, 2024", amount: "-$45.50", type: "expense" },
    { description: "Adelanto - Gala Corporativa", date: "20 de Julio, 2024", amount: "+$1,000.00", type: "income" },
    { description: "Renta de Estudio de Ensayo", date: "18 de Julio, 2024", amount: "-$150.00", type: "expense" },
    { description: "Reparación de Vihuela", date: "15 de Julio, 2024", amount: "-$220.00", type: "expense" },
];


export default function FinancePage() {
  return (
    <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
            <h1 className="font-headline text-3xl font-bold tracking-tight">
                Finanzas (Admin)
            </h1>
            <p className="text-muted-foreground">
                Resumen financiero de la banda.
            </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">$45,231.89</div>
                    <p className="text-xs text-muted-foreground">+20.1% desde el mes pasado</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">$12,874.32</div>
                    <p className="text-xs text-muted-foreground">+15.2% desde el mes pasado</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Beneficio Neto</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">$32,357.57</div>
                    <p className="text-xs text-muted-foreground">+22.5% desde el mes pasado</p>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Transacciones Recientes</CardTitle>
                <CardDescription>
                    Lista de los últimos movimientos financieros.
                </CardDescription>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {transactions.map((transaction) => (
                    <TableRow key={transaction.description}>
                        <TableCell className="font-medium flex items-center gap-2">
                            {transaction.type === 'income' ? <ArrowUpRight className="h-4 w-4 text-green-500" /> : <ArrowDownLeft className="h-4 w-4 text-red-500" /> }
                            {transaction.description}
                        </TableCell>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell className={`text-right font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{transaction.amount}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
    </div>
  )
}