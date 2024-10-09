import preactLogo from '../../assets/tatum.jpeg'
import Form from './form';
import './style.css';

export function Home() {
	return (
		<div class="home">
			<a href="https://preactjs.com" target="_blank" rel="noopener noreferrer">
				<img src={preactLogo} alt="Preact logo" height="160" width="160" />
			</a>
			<h1>Tatum ETH Checker</h1>
			<Form />
		</div>
	);
}